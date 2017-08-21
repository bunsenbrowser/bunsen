var through = require('through2')
var isAnsi = require('ansi-regex')

var MOVE_LEFT = Buffer('1b5b3130303044', 'hex')
var MOVE_UP = Buffer('1b5b3141', 'hex')
var MOVE_DOWN = Buffer('1b5b3142', 'hex')
var CLEAR_LINE = Buffer('1b5b304b', 'hex')
var NEWLINE = Buffer('\n')

module.exports = createStream

function diffLine (older, newer, bufs) {
  var min = Math.min(older.length, newer.length)

  for (var i = 0; i < min; i++) {
    if (older[i] !== newer[i]) break
  }

  if (!i || isAnsi().test(newer.slice(0, i))) { // ansi diffing doesn't work right now
    bufs.push(CLEAR_LINE)
    bufs.push(Buffer(newer + '\n'))
  } else {
    var changed = newer.slice(i)
    bufs.push(Buffer('1b5b' + Buffer('' + i).toString('hex') + '43', 'hex'))
    bufs.push(Buffer(changed))
    bufs.push(CLEAR_LINE)
    bufs.push(NEWLINE)
  }
}

function createStream () {
  var prev = []
  var stream = through(write)

  stream.reset = function () {
    for (var i = 0; i < prev.length; i++) {
      prev[i] = '###############' // haxx
    }
  }

  stream.clear = function () {
    stream.reset()
    stream.write('')
  }

  return stream

  function write (data, enc, cb) {
    var str = data.toString()
    var lines = str ? str.split('\n') : []
    var diff = Array(lines.length)
    var pos = -1
    var i = 0

    for (i = 0; i < lines.length; i++) {
      if (i < prev.length) {
        var old = prev[i]
        if (old !== lines[i]) {
          if (pos === -1) pos = i
          diff[i] = 1
        } else {
          diff[i] = 0
        }
      } else {
        diff[i] = 2
      }
    }

    var bufs = []
    var movedOnce = false

    for (i = lines.length; i < prev.length; i++) {
      if (!movedOnce) {
        bufs.push(MOVE_LEFT)
        movedOnce = true
      }
      bufs.push(MOVE_UP)
      bufs.push(CLEAR_LINE)
    }

    if (pos > -1) {
      var missing = Math.min(prev.length, lines.length) - pos
      bufs.push(Buffer('1b5b' + Buffer('' + missing).toString('hex') + '41', 'hex'))
    } else {
      pos = prev.length
    }

    for (; pos < lines.length; pos++) {
      if (!movedOnce) {
        bufs.push(MOVE_LEFT)
        movedOnce = true
      }
      if (diff[pos] > 0) {
        if (diff[pos] === 1) diffLine(prev[pos], lines[pos], bufs)
        else bufs.push(Buffer(lines[pos] + '\n'))
      } else {
        bufs.push(MOVE_DOWN)
      }
    }

    prev = lines
    cb(null, Buffer.concat(bufs))
  }
}
