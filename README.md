# @ava/get-port

Experimental AVA plugin which works like [`get-port`](https://github.com/sindresorhus/get-port), but ensures the port is locked across all test files.

Install this as a development dependency alongside AVA itself:

```console
npm install --save-dev @ava/get-port
```

Then make sure you've enabled the shared workers experiment:

`ava.config.js`:

```js
export default {
  nonSemVerExperiments: {
    sharedWorkers: true
  }
};
```

## Usage

```ts
const {default: getPort} = require('@ava/get-port');

test.before('get port', async t => {
  t.context.port = await getPort();
});
```

`getPort()` reserves a port, such that no other concurrently executing test file also using `getPort()` will select that same port. To ensure the port is available it then (briefly) listens. You can [pass options used when listening](https://nodejs.org/docs/latest/api/net.html#net_server_listen_options_callback). You can't pass `port` though.
