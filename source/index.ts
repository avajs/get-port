import crypto from 'crypto';
import net from 'net';
import {SharedContext} from '@ava/cooperate';

const context = new SharedContext(__filename);

// Reserve a range of 16 addresses at a random offset.
const reserveRange = async (): Promise<number[]> => {
	let from: number;
	do {
		from = crypto.randomBytes(2).readUInt16BE(0);
	} while (from < 1024 || from > 65520);

	const range = Array.from({length: 16}, (_, index) => from + index);
	return context.reserve(...range);
};

// Listen on the port to make sure it's available.
const confirmAvailable = async (port: number, options?: net.ListenOptions): Promise<boolean> => new Promise((resolve, reject) => {
	const server = net.createServer();
	server.unref();
	server.on('error', (error: Error & { code: string }) => {
		if (error.code === 'EADDRINUSE' || error.code === 'EACCESS') {
			resolve(false);
		} else {
			reject(error);
		}
	});
	server.listen({...options, port}, () => {
		server.close(() => resolve(true));
	});
});

let available: Promise<number[]> = reserveRange();
export default async function getPort(options?: Omit<net.ListenOptions, 'port'>): Promise<number> { // eslint-disable-line @typescript-eslint/ban-types
	const promise = available;
	const range = await promise;
	const port = range.shift();

	if (available === promise && range.length === 0) {
		// (Pro-actively) reserve a new range
		available = reserveRange();
	}

	if (port === undefined || !(await confirmAvailable(port, options))) {
		return getPort(options);
	}

	return port;
}
