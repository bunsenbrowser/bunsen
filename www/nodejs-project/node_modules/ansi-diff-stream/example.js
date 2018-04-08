var differ = require('./')
var crypto = require('crypto')

var diff = differ()
var tick = 0
var showing = false
var frameSize = 0

function frame () {
  var lines = [
    'Last frame was ' + frameSize + 'b',
    'Hello, this is a demo',
    'The time is: ' + Date.now() + 'ms since 1970',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Random data: ' + crypto.randomBytes(32).toString('hex') + ' ...',
    'And this line is static \\o/'
  ]

  if (Math.random() < 0.5) tick++

  if (tick === 5) {
    tick = 0
    showing = !showing
  }

  if (showing) lines.push('Once in a while this line is here')

  lines.push(
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz',
    'Foo bar baz, foo bar baz, foo bar baz, foo bar baz'
  )

  return lines.join('\n')
}

diff.write(frame())
setInterval(function () {
  diff.write(frame())
}, 500)

diff.on('data', function (data) {
  frameSize = data.length
  process.stdout.write(data)
})

process.stdout.on('resize', function () {
  diff.reset()
})
