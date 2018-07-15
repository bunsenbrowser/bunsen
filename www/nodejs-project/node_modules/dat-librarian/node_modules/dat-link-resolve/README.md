# dat-link-resolve

resolve urls, links to a dat key using common methods

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

### Supports

* Common dat key representations (`dat://`, etc.)
* URLs with keys in them (`datproject.org/6161616161616161616161616161616161616161616161616161616161616161`)
* `hyperdrive-key` or `dat-key` headers
* Url to JSON http request that returns `{key: <dat-key>}`
* Dat-DNS resolution ([details](https://github.com/beakerbrowser/beaker/wiki/Authenticated-Dat-URLs-and-HTTPS-to-Dat-Discovery))

## Install

```
npm install dat-link-resolve
```

## Usage

```js
var datResolve = require('dat-link-resolve')

datResolve(link, function (err, key) {
  console.log('found key', key)
})
```

## API

### `datResolve(link, callback(err, key))`

Link can be string or buffer.

Resolution order:

1. Validate buffers or any strings with 64 character hashes in them via [dat-encoding](https://github.com/juliangruber/dat-encoding)
2. Check headers in http request
3. Check JSON request response for `key`
4. Dat-DNS resolution via [dat-dns](https://github.com/datprotocol/dat-dns)

## Refering to dats
Trying to tighten up a bit dat-link-resolve (and its dependencies dat-dns and dat-decode). I am noticing a few inconsistencies as I'm writing dat-shell.

Ideally, I'd like to launch dat-shell like this:
```sh
$ dat-shell dat://40a7f6b6147ae695bcbcff432f684c7bb5291ea339c28c1755896cdeb80bd2f9+5/path4
```

and have it open the dat at version 5 and change directory to /path4.

Currently ```dat-shell google-fonts-kewitz.hashbase.io/fonts/``` [fails somewhere in dat-link-resolve](https://github.com/millette/dat-shell/issues/5).

### Examples
Note that dat-link-resolve also supports other methods, such as detection of dat keys in paths and http headers.

#### Simplest
* Plain: 40a7f6b6147ae695bcbcff432f684c7bb5291ea339c28c1755896cdeb80bd2f9
* DNS: pfrazee.hashbase.io

#### With version
* Plain: 40a7f6b6147ae695bcbcff432f684c7bb5291ea339c28c1755896cdeb80bd2f9+5
* DNS: pfrazee.hashbase.io+5

#### With scheme
* https: https://40a7f6b6147ae695bcbcff432f684c7bb5291ea339c28c1755896cdeb80bd2f9/
* dat: dat://pfrazee.hashbase.io

#### With path
* https: 40a7f6b6147ae695bcbcff432f684c7bb5291ea339c28c1755896cdeb80bd2f9/path1
* dat: pfrazee.hashbase.io/path2

#### Combinations
* 40a7f6b6147ae695bcbcff432f684c7bb5291ea339c28c1755896cdeb80bd2f9+5/path3
* dat://40a7f6b6147ae695bcbcff432f684c7bb5291ea339c28c1755896cdeb80bd2f9+5/path4
* https://40a7f6b6147ae695bcbcff432f684c7bb5291ea339c28c1755896cdeb80bd2f9/path5 [(^1)][]
* https://pfrazee.hashbase.io+5/path6 [(^2)][]

### Notes
1. browsers expect http and https schemes with traditional hostname, not a dat key
2. browsers expect http and https schemes with traditional hostname, no +5 (version) support

## Contributing

Contributions welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## License

[MIT](LICENSE.md)

[npm-image]: https://img.shields.io/npm/v/dat-link-resolve.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/dat-link-resolve
[travis-image]: https://img.shields.io/travis/joehand/dat-link-resolve.svg?style=flat-square
[travis-url]: https://travis-ci.org/joehand/dat-link-resolve
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[(^1)]: <#notes>
[(^2)]: <#notes>
