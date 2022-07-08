import net from 'node:net';
import os from 'node:os';
import {promisify} from 'node:util';
import test from 'ava';
import getPort from '../source/index.js';

test.serial('gets up to 16 ports in a block', async t => {
	const first = await getPort();
	let count = 1;

	let newBlock;
	while (newBlock === undefined) {
		const port = await getPort(); // eslint-disable-line no-await-in-loop
		if (port > first && port - 16 <= first) {
			count++;
		} else {
			newBlock = port;
		}
	}

	t.true(count > 1);
	t.true(count <= 16);

	t.log({count, first, newBlock});
});

function * range(from: number, to: number) {
	for (let i = from; i < to; i++) {
		yield i;
	}
}

test.serial('skips used ports', async t => {
	const first = await getPort();
	t.log({first});

	let attempt;
	for await (const i of range(1, 16)) {
		attempt?.discard();
		attempt = await t.try(async tt => {
			const reserved = first + i;
			tt.log({reserved});

			const server = net.createServer();
			tt.teardown(() => server.close());

			const listen: (port: number) => Promise<void> = promisify(server.listen.bind(server));
			await listen(reserved);

			const port = await getPort();
			tt.log({port});
			tt.true(port > reserved);
		});

		if (attempt.passed) {
			break;
		}
	}

	attempt?.commit();
});

test.serial('fails on invalid hosts', async t => {
	let code;
	let host;
	for await (const info of Object.values(os.networkInterfaces()).flatMap(interfaces => interfaces ?? [])) {
		const server = net.createServer();
		t.teardown(() => server.close());

		const unavailable = await new Promise<{code: 'EADDRNOTAVAIL' | 'EINVAL'; host: string} | undefined>((resolve, reject) => {
			server.on('error', (error: Error & {code: string}) => {
				if (error.code === 'EADDRNOTAVAIL' || error.code === 'EINVAL') {
					resolve({code: error.code, host: info.address});
				} else {
					reject(error);
				}
			});
			server.listen({host: info.address, port: 0}, () => {
				resolve(undefined);
			});
		});

		if (unavailable !== undefined) {
			({code, host} = unavailable);
			break;
		}
	}

	t.not(host, undefined);
	await t.throwsAsync(getPort({host}), {code});
});

test('port can be bound', async t => {
	const server = net.createServer();
	t.teardown(() => server.close());

	const port = await getPort();
	const listen: (port: number) => Promise<void> = promisify(server.listen.bind(server));
	await listen(port);
	t.is((server.address() as net.AddressInfo).port, port);
});

test('can get ports simultaneously', async t => {
	await t.notThrowsAsync(Promise.all([getPort(), getPort()]));
});
