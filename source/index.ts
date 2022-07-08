import crypto from 'node:crypto';
import net from 'node:net';
import os from 'node:os';
import {SharedContext} from '@ava/cooperate';

const context = new SharedContext(import.meta.url);

const localHosts = new Set([
	undefined, // Default interfaces,
	'0.0.0.0', // Ensure we check IPv4,
	...Object.values(os.networkInterfaces()).flatMap(interfaces => interfaces?.map(info => info.address)),
]);

// Reserve a range of 16 addresses at a random offset.
const reserveRange = async (): Promise<number[]> => {
	let from: number;
	do {
		from = crypto.randomBytes(2).readUInt16BE(0);
	} while (from < 1024 || from > 65_520);

	const range = Array.from({length: 16}, (_, index) => from + index);
	return context.reserve(...range);
};

const enum Availability {
	AVAILABLE,
	UNAVAILABLE,
	UNKNOWN,
}

// Listen on the port to make sure it's available.
const confirmAvailableForHost = async ({
	host,
	listenOptions,
	port,
	unknowable,
}: {
	host: string | undefined;
	listenOptions?: net.ListenOptions;
	port: number;
	unknowable: boolean;
}): Promise<Availability> => new Promise((resolve, reject) => {
	const server = net.createServer();
	server.unref();
	server.on('error', (error: Error & {code: string}) => {
		if (error.code === 'EADDRINUSE' || error.code === 'EACCESS') {
			resolve(Availability.UNAVAILABLE);
		} else if (unknowable && (error.code === 'EADDRNOTAVAIL' || error.code === 'EINVAL')) { // https://github.com/sindresorhus/get-port/blob/0760c987c17581395d4e30432881dcb0ca6ca94a/index.js#L65
			resolve(Availability.UNKNOWN); // The address itself is not available, so we can't check.
		} else {
			reject(error);
		}
	});
	server.listen({...listenOptions, host, port}, () => {
		server.close(() => {
			resolve(Availability.AVAILABLE);
		});
	});
});

const confirmAvailable = async (port: number, listenOptions?: net.ListenOptions): Promise<boolean> => {
	if (listenOptions?.host !== undefined) {
		const available = await confirmAvailableForHost({
			host: listenOptions.host,
			listenOptions,
			port,
			unknowable: false,
		});
		return available === Availability.AVAILABLE;
	}

	for await (const host of localHosts) {
		const available = await confirmAvailableForHost({
			host,
			listenOptions,
			port,
			unknowable: true,
		});

		if (available === Availability.UNAVAILABLE) {
			return false;
		}
	}

	return true;
};

let available: Promise<number[]> = reserveRange();
export default async function getPort(options?: Omit<net.ListenOptions, 'port'>): Promise<number> {
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
