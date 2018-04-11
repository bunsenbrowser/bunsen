var minimist = require('minimist')
var cliclopts = require('cliclopts')
var xtend = require('xtend')
var debug = require('debug')('subcommand')

module.exports = function subcommand (config, options) {
  if (!options) options = {}
  if (Array.isArray(config)) {
    config = { commands: config }
  }
  if (!config.commands) config.commands = []
  if (!config.defaults) config.defaults = []
  if (config.usage && !config.usage.option) {
    if (typeof config.usage !== 'object') config.usage = {} // allow config.usage = true
    config.usage.option = { name: 'help', abbr: 'h' }
  }
  // return value false means it was not handleds
  // return value true means it was
  return function matcher (args) {
    var root = config.root
    if (root && root.options) {
      var rootClic = cliclopts(config.defaults.concat(root.options))
      var rootOpts = rootClic.options()
    }
    var parseOpts = xtend(options.minimistOpts || {}, rootOpts)
    var argv = minimist(args, parseOpts)
    debug('parsed', argv)
    var sub = findCommand(argv._, config.commands)
    if (config.all) config.all(argv)
    if (!sub) {
      if (config.usage && (argv[config.usage.option.name] || argv[config.usage.option.abbr])) {
        debug('Printing general usage')
        if (config.usage.command) config.usage.command(argv, config.usage.help, rootClic.usage())
        else {
          if (config.usage.help) process.stdout.write(config.usage.help + '\n')
          process.stdout.write(rootClic.usage())
        }
        return true
      }
      if (argv._.length === 0 && root && root.command) {
        root.command(argv)
        return true
      }
      if (config.none) config.none(argv)
      return false
    }
    var subMinimistOpts = {}
    var subOpts = config.defaults.concat(sub.command.options || [])
    var subClic = cliclopts(subOpts)
    subMinimistOpts = subClic.options()
    var subargv = minimist(args, subMinimistOpts)
    subargv._ = subargv._.slice(sub.commandLength)
    if (config.usage && (subargv[config.usage.option.name] || subargv[config.usage.option.abbr])) {
      debug('Printing subcommand usage')
      if (sub.command.usage) sub.command.usage(subargv, sub.command.help, subClic.usage())
      else {
        if (sub.command.help) process.stdout.write(sub.command.help + '\n')
        process.stdout.write(subClic.usage())
      }
      return true
    }
    process.nextTick(function doCb () {
      sub.command.command(subargv, subClic)
    })
    return true
  }
}

function findCommand (args, commands) {
  var match, commandLength
  commands
    .map(function each (c, idx) {
      // turn e.g. 'foo bar' into ['foo', 'bar']
      return {name: c.name.split(' '), index: idx}
    })
    .sort(function each (a, b) {
      return a.name.length > b.name.length
    })
    .forEach(function eachCommand (c) {
      var cmdString = JSON.stringify(c.name)
      var argString = JSON.stringify(args.slice(0, c.name.length))
      if (cmdString === argString) {
        match = commands[c.index]
        commandLength = c.name.length
      }
    })
  var returnData = {command: match, commandLength: commandLength}
  debug('match', match)
  if (match) return returnData
  else return false
}
