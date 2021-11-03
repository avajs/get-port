import net from 'node:net';
import {promisify} from 'node:util';
import test from 'ava';
import getPort from '../source/index.js';

test('gets up to 16 ports in a block', async t => {
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
