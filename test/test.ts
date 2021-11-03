import net from 'node:net';
import {promisify} from 'node:util';
import test from 'ava';
import getPort from '../source';

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
	await promisify(server.listen.bind(server))(port);
	t.is((server.address() as any).port, port);
});

test('can get ports simultaneously', async t => {
	await t.notThrowsAsync(Promise.all([getPort(), getPort()]));
});
