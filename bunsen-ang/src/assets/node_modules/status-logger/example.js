var statusLogger = require('.')

var output = ['RUNNING...\n', [], []]
var messages = output[1]
var progress = output[2]
var log = statusLogger(output)
setInterval(function () {
  log.print()
}, 100)

// Messages are one-time things I don't plan to overwrite
messages.push(`msg #${messages.length}: We are starting this. Let us send a message`)

// Progress lines I will overwrite more. There are only a few and I want to track them.
var percentage = 0
progress[0] = '' // spacer
progress[1] = 'Percentage ' + percentage + '%'
progress[2] = 'prog #1: I will not change until we finish.'
progress[3] = 'prog #2: I will change at half way.'

// update percentage & will print updated info with interval
var it = setInterval(function () {
  percentage += 1
  if (!(percentage % 10)) messages.push(`msg #${messages.length}: This message will print sometimes. % is ${percentage}`)
  if (percentage === 50) progress[3] = 'prog #2: We got halfway'
  progress[1] = 'Percentage ' + percentage + '%'

  if (percentage === 100) {
    clearInterval(it)
    progress = output[2] = ['\nWe finished!', 'Clear the progress lines.']
    idle()
  }
}, 100)

function idle () {
  setTimeout(function () {
    output = log.clear()
    output[0] = 'This has been idle for 2 seconds. Clearing messages.'
    beforeExit()
  }, 2000)
}

function beforeExit () {
  setTimeout(function () {
    output[0] = 'About to exit. I want to make sure to print this immediately.'
    log.print()
    process.exit(0)
  }, 2000)
}
