# dat-json

read &amp; write dat.json files. Uses toiletdb under the hood.

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

## Install

```
npm install dat-json
```

## Usage

```js
var DatJSON = require('dat-json')

var datjson = DatJSON(archive)

datjson.create({title: 'a dat', description: 'exciting'}, function (err) {
  if (err) throw err
})

datjson.read(function (err, data) {
  console.log(data)
})
```

Write to a `dat.json` on the file system also:

```js
var DatJSON = require('dat-json')

var datjson = DatJSON(archive, {file: path.join(dat.path, 'dat.json')})

datjson.create({title: 'a dat', description: 'exciting'}, function (err) {
  if (err) throw err
})
```

**TODO: replace file option with hyperdrive indexing**

## API

### `var datjson = DatJSON(archive, [opts])`

create a new datJson db

Options:

* `opts.file` - dat.json file path, updates will be written to file system and archive

#### `datjson.create([data], cb)`

Create a new `dat.json` file in the archive with the default keys (`url`, `title`, `description`). Pass in any additional data to add on initial create.

#### `datjson.write(key, val, cb)` or `datjson.write(data, cb)`

Write a single `key` and `value` or an object, `data`, to the `dat.json` file. Use `file` option above to also update the file on the file system.

#### `datjson.delete(key, cb)`

Delete a `key` from the `dat.json` file.

#### `datjson.read(cb)`

Read the current `dat.json`.

## License

[MIT](LICENSE.md)

[npm-image]: https://img.shields.io/npm/v/dat-json.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/dat-json
[travis-image]: https://img.shields.io/travis/joehand/dat-json.svg?style=flat-square
[travis-url]: https://travis-ci.org/joehand/dat-json
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
