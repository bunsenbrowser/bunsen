var neatLog = require('.')
var output = require('./output')
var chalk = require('chalk')

var views = [headerView, progressView]
var log = neatLog(views)
log.use(trackProgress)
log.render() // force an immediate render

function headerView (state) {
  return output`
    Hello World!
  `
}

function progressView (state) {
  if (!state.seconds) return 'Not counting yet...'
  return output`
    ${chalk.blue(state.seconds)} ${state.seconds === 1 ? 'second' : 'seconds'}
  `
}

function trackProgress (state, bus) {
  state.seconds = 0
  setInterval(function () {
    state.seconds++
    bus.emit('render')
  }, 1000)
}
