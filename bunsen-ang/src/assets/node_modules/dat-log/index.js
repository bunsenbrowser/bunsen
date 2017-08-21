var fs = require('fs')
var prettyBytes = require('prettier-bytes')
var neatLog = require('neat-log')
var output = require('neat-log/output')
var Dat = require('dat-node')
var ram = require('random-access-memory')

module.exports = function (opts) {
  var usage = 'Usage: dat-log [key|dir] [--live,-l]'
  if (opts.help) {
    console.error(usage)
    process.exit()
  }

  var neat = neatLog(view)
  neat.use(function (state, bus) {
    state.opts = opts
    state.opts.sparse = true
    state.opts.createIfMissing = false
    var dir = null
    if (opts._[0]) {
      try {
        if (fs.statSync(opts._[0]).isDirectory()) dir = opts._[0]
      } catch (e) {
        state.opts.key = opts._[0]
        dir = ram
      }
    } else {
      dir = process.cwd()
    }

    Dat(dir, state.opts, function (err, dat) {
      if (err && err.name === 'MissingError') {
        bus.clear()
        console.error('No dat found in', dir)
        console.error('')
        console.error(usage)
        process.exit(1)
      } else if (err) {
        console.error(err)
        process.exit(1)
      }

      state.dat = dat
      state.log = []
      state.puts = 0
      state.dels = 0
      bus.on('update', function () {
        state.verLen = state.dat.archive.version.toString().length
        state.zeros = new Array(state.verLen).join('0')
      })
      bus.emit('render')

      dat.trackStats()
      if (dat.writable) {
        bus.emit('update')
        return run()
      }

      // var waitTimeout TODO
      state.offline = true

      dat.joinNetwork(function () {
        if (!state.opts.live && state.offline && !dat.network.connecting) exit()
      }).once('connection', function () {
        state.offline = false
        // clearTimeout(waitTimeout) // TODO: close if not live
      })
      dat.archive.ready(function () {
        bus.emit('update')
      })
      dat.archive.on('content', function () {
        bus.emit('update')
        dat.archive.content.update()
      })

      if (!state.opts.live) {
        // wait for connections
        setTimeout(exit, 3000)
      }

      if (!state.opts.key) run()
      else dat.archive.metadata.update(run)

      function run () {
        state.running = true
        var rs = dat.archive.history({ live: state.opts.live || state.offline })
        rs.on('data', function (data) {
          var version = `${state.zeros.slice(0, state.verLen - data.version.toString().length)}${data.version}`
          var msg = `${version} [${data.type}] ${data.name}`
          if (data.type === 'put') {
            msg += ` ${prettyBytes(data.value.size)} (${data.value.blocks} ${data.value.blocks === 1 ? 'block' : 'blocks'})`
            state.puts++
          } else {
            state.dels++
          }
          state.log.push(msg)
          bus.emit('render')
        })
      }

      function exit () {
        state.exiting = true
        bus.render()
        process.exit(0)
      }
    })
  })

  function view (state) {
    if (!state.running) {
      if (state.opts.key) return 'Connecting to network...'
      return 'Reading dat history...'
    }
    return output`
      ${state.log.join('\n')}
      ${state.offline
          ? state.exiting
            ? '\nNo sources found in network.\nLog may be outdated.'
            : '...\n\nConnecting to network to update & verify log...'
          : '\nLog synced with network'}

      Archive has ${state.dat.archive.version} changes (puts: +${state.puts}, dels: -${state.dels})
      Current Size: ${prettyBytes(state.dat.stats.get().byteLength)}
      Total Size:
      - Metadata ${prettyBytes(state.dat.archive.metadata.byteLength)}
      - Content ${prettyBytes(state.dat.archive.content.byteLength)}
      Blocks:
      - Metadata ${state.dat.archive.metadata.length}
      - Content ${state.dat.archive.content.length}
    `
  }
}
