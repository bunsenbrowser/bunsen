# dat-gateway

[![Stability](https://img.shields.io/badge/stability-experimental-orange.svg)](https://nodejs.org/api/documentation.html#documentation_stability_index)
[![NPM Version](https://img.shields.io/npm/v/dat-gateway.svg)](https://www.npmjs.com/package/dat-gateway)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Build Status](https://travis-ci.org/garbados/dat-gateway.svg?branch=master)](https://travis-ci.org/garbados/dat-gateway)
[![Coverage Status](https://img.shields.io/coveralls/github/garbados/dat-gateway/master.svg)](https://coveralls.io/github/garbados/dat-gateway?branch=master)

A configurable in-memory [Dat](https://datproject.org/)-to-HTTP gateway, so you can visit Dat archives from your browser.

If you want a browser that can visit Dat archives, check out [Beaker](https://beakerbrowser.com/).

## Install

To get the `dat-gateway` command for running your own gateway, use [npm](https://www.npmjs.com/):

```
npm i -g dat-gateway
```

## Usage

You can run `dat-gateway` to start a gateway server that listens on port 3000. You can also configure it! You can print usage information with `dat-gateway -h`:

```
$ dat-gateway -h
dat-gateway

Options:
  --version       Show version number                                  [boolean]
  --config        Path to JSON config file
  --port, -p      Port for the gateway to listen on.             [default: 3000]
  --dir, -d       Directory to use as a cache.
                                            [string] [default: "~/.dat-gateway"]
  --max, -m       Maximum number of archives allowed in the cache. [default: 20]
  --period        Number of milliseconds between cleaning the cache of expired
                  archives.                                     [default: 60000]
  --ttl, -t       Number of milliseconds before archives expire.
                                                               [default: 600000]
  --redirect, -r  Whether to use subdomain redirects            [default: false]
  -h, --help      Show help                                            [boolean]
```

You can visit Dat archives through the gateway using a route like this:

```
http://localhost:3000/{datKey}/{path...}
```

For example:

```
http://localhost:3000/40a7f6b6147ae695bcbcff432f684c7bb5291ea339c28c1755896cdeb80bd2f9/assets/img/beaker-0.7.gif
```

The gateway will even resolve URLs using [Dat-DNS](https://github.com/beakerbrowser/beaker/wiki/Authenticated-Dat-URLs-and-HTTPS-to-Dat-Discovery):

```
http://localhost:3000/garbados.hashbase.io/icons/favicon.ico
```

The gateway will peer archives until they expire from the cache, at which point it proactively halts them and deletes them from disk.

The gateway also supports replicating a hyperdrive instance using [websockets](https://github.com/maxogden/websocket-stream)

```javascript
const Websocket = require('websocket-stream')
const hyperdrive = require('hyperdrive')

const key = 'c33bc8d7c32a6e905905efdbf21efea9ff23b00d1c3ee9aea80092eaba6c4957'
const url = `ws://localhost:3000/${key}`

const archive = hyperdrive('./somewhere', key)

archive.once('ready', () => {
  const socket = websocket(url)

  // Replicate through the socket
  socket.pipe(archive.replicate()).pipe(socket)
})
```

## Subdomain redirection

By default dat-gateway will serve all dats from the same origin. This means that dats using absolute URLs (starting with `/`) will be broken.
This also means that all dats will share the same localStorage and indexedDB instances which can cause security issues.

In order to resolve these issues, you can use the `--redirect` flag in conjunction with the `lvh.me` domain to have each dat served on a subdomain.

For example, `http://lvh.me:3000/{datkey}/index.html` will be redirected to `http://{datkey32}.lvh.me/index.html` which will serve the file from localhost, but at a different domain, ensuring the browser isolates all the contents from each other.

Please note that due to limitations in how URLs work, the dat key will be converted to it's base32 representation instead of hexadecimal using [this library](https://github.com/RangerMauve/hex-to-32)

## Contributions

All contributions are welcome: bug reports, feature requests, "why doesn't this work" questions, patches for fixes and features, etc. For all of the above, [file an issue](https://github.com/garbados/dat-gateway/issues) or [submit a pull request](https://github.com/garbados/dat-gateway/pulls).

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
