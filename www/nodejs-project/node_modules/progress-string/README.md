# progress-string

Generate a CLI progress bar as a string that you can then output in any
way you like.

![progress](https://cloud.githubusercontent.com/assets/10602/20219491/064d4794-a86d-11e6-816c-a0a72d792987.gif)

[![Build status](https://travis-ci.org/watson/progress-string.svg?branch=master)](https://travis-ci.org/watson/progress-string)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

## Installation

```
npm install progress-string --save
```

## Usage

```js
var progress = require('progress-string')
var diff = require('ansi-diff-stream')()

var value = 0
var total = 42
var bar = progress({width: 50, total: total})

setInterval(function () {
  diff.write(
    'The progress of the program is:\n' +
    bar(++value)
  )
  if (value === total) process.exit()
}, 250)

diff.pipe(process.stdout)
```

## API

### `var bar = progress(options)`

This module exposes a function that takes a single `options` argument
and retuns a bar function.

These are the options:

- `total` - (integer) The max value of the progress bar
- `width` - (integer, default: 42) The width of the progress bar in chars
- `incomplete` - (string, default: `-`) The char used to indicate the
  incomplete part of the progress bar
- `complete` - (string, default: `=`) The char used to indicate the
  completed part of the progress bar
- `style` - (function, optional) See `options.style` below for details

#### `options.style`

You can provide a custom styling function to style the progress bar
returned by the `bar` function.

It will be called with two arguments: `complete` and `incomplete`. Each
a string representing its part of the progress bar.

Whatever the style function returns will be returned by the `bar`
function.

```js
var bar = progress({
  width: 10,
  total: 100,
  style: function (complete, incomplete) {
    // add an arrow at the head of the completed part
    return complete + '>' + incomplete
  }
})

console.log(bar(50)) // =====>-----
```

### `var str = bar(value)`

Call the `bar` function with the `value` you want to the generated
progress bar to have.

The `bar` function will return a string representation of the progress
bar.

## License

MIT
