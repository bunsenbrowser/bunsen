var statusLogger = require('.')

// Set output up so its easy to see which line prints what
var output = [
  'Starting...', // Status Message
  '', // Spacer
  '' // Percent Done
]
var log = statusLogger(output)
setInterval(function () {
  log.print()
}, 100)
log.print() // Avoid delay in printing first message

setTimeout(start, 250)
function start () {
  var percent = 0
  output[0] = 'Running...'

  var it = setInterval(function () {
    percent += 10
    output[2] = `${percent}% completed`

    if (percent >= 100) {
      clearInterval(it)
      output[0] = 'All Done!'
      output[2] = `Successfully counted to ${percent}.`
      exit()
    }
  }, 500)
}

function exit () {
  setTimeout(function () {
    output = log.clear() // create a new empty array
    output.push('Thanks for playing!')
    output.push('Gonna exit now.')
    log.print()
    setTimeout(function () {
      process.exit(0)
    }, 1000)
  }, 2000)
}
