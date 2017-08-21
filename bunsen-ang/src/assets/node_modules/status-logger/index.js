var assert = require('assert')
var differ = require('ansi-diff-stream')

module.exports = function (messages, opts) {
  assert.ok(messages && Array.isArray(messages), 'status-logger: Message array required')
  if (!Array.isArray(messages[0])) messages = [messages]
  if (!opts) opts = {}

  var logger = {}
  logger.messages = logger.groups = messages // groups = v2 backwards compat
  logger.diff = differ()
  logger.clear = clear
  logger.print = print

  if (!opts.debug && !opts.quiet) {
    logger.diff.pipe(process.stdout)
    process.stdout.on('resize', function () {
      logger.diff.reset()
    })
  }

  return logger

  function print (lines) {
    var output = lines || logger.messages
    var msg = flatten(output).join('\n')
    if (opts.debug) console.log(msg)
    else if (!opts.quiet) logger.diff.write(msg)

    function flatten (arr) {
      return arr.reduce(function (a, b) {
        return a.concat(Array.isArray(b) ? flatten(b) : b)
      }, [])
    }
  }

  function clear (newLines) {
    logger.messages = newLines || []
    logger.diff.clear()
    return logger.messages
  }
}
