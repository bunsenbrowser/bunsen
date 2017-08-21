# ansi-diff-stream

A transform stream that diffs input buffers and outputs the diff as ANSI.
If you pipe this to a terminal it will update the output with minimal changes.

```
npm install ansi-diff-stream
```

[![build status](http://img.shields.io/travis/mafintosh/ansi-diff-stream.svg?style=flat)](http://travis-ci.org/mafintosh/ansi-diff-stream)

## Usage

``` js
var differ = require('ansi-diff-stream')
var diff = differ()

setInterval(function () {
  diff.write(
    'This is a demo\n' +
    'The time is: ' + new Date() + '\n' +
    'That is all'
  )
}, 500)

diff.pipe(process.stdout)
```

Running the above example will produce an output that looks like this:

```
This is a demo
The time is: Thu Jul 14 2016 19:46:56 GMT+0200 (CEST)
That is all
```

Every half second the time will update.
The diff produced by running the above means that the terminal will move the cursor to the beginning of the time stamp only update that part.

For a more advanced example see `example.js`.

## API

#### `var stream = differ()`

Create a new diff stream. You should pipe it to a ansi capable stream.

#### `stream.reset()`

Will reset the diff. Useful you print something manually inbetween updates.

#### `stream.clear()`

Clear the last printed output from the screen. Similar to doing `stream.write('')`.

## CLI

There is a command line tools available as

```
npm install -g ansi-diff-stream
nc -l 10000 | ansi-diff-stream
```

In another terminal

```
nc localhost 10000
hello
world
```

## License

MIT
