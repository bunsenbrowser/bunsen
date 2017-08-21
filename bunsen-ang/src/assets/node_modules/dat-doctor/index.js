var dnsDiscovery = require('dns-discovery')
var swarm = require('discovery-swarm')
var crypto = require('crypto')
var pump = require('pump')
var defaults = require('datland-swarm-defaults')()
var dns = require('dns')
var thunky = require('thunky')
var fmt = require('util').format
var EOL = require('os').EOL
var debug = require('debug')('dat-doctor')

var doctor = 'doctor1.publicbits.org'

module.exports = function (opts) {
  var port = typeof opts.port === 'number' ? opts.port : 3282
  var id = typeof opts.id === 'string' ? opts.id : crypto.randomBytes(32).toString('hex')
  var out = opts.out || process.stderr
  var log = function () {
    out.write(fmt.apply(null, arguments) + EOL)
  }

  debug('[info] Looking up public server address')
  dns.lookup(doctor, function (err, address, family) {
    if (err) {
      log('[error] Could not resolve', doctor, 'skipping...')
      return startP2PDNS()
    }
    log('[info] Testing connection to public peer')
    startPublicPeer(address, function (err) {
      if (err) return log(err)
      log('')
      log('[info] End of phase one (Public Server), moving on to phase two (Peer to Peer via DNS)')
      log('')
      startP2PDNS()
    })
  })

  function startPublicPeer (address, cb) {
    var tests = [
      {
        name: 'utp only',
        utp: true,
        tcp: false,
        port: 3282
      },
      {
        name: 'tcp only',
        utp: false,
        tcp: true,
        port: 3283
      }
    ]
    var pending = tests.length
    tests.forEach(function (test) {
      test.address = address
      runPublicPeerTest(test, function (err) {
        if (err) return cb(err)
        if (!--pending) cb()
      })
    })
  }

  function runPublicPeerTest (opts, cb) {
    var address = opts.address
    var name = opts.name || 'test'
    var port = opts.port || 3282

    var connected = false
    var dataEcho = false

    if (opts.utp && !opts.tcp) {
      // Check UTP support for utp only
      // TODO: discovery swarm fails hard if no server works
      try {
        require('utp-native')
      } catch (err) {
        log('[error] FAIL - unable to load utp-native, utp connections will not work')
        return cb()
      }
    }

    var sw = swarm({
      dns: {
        servers: defaults.dns.server
      },
      whitelist: [address],
      dht: false,
      hash: false,
      utp: opts.utp,
      tcp: opts.tcp
    })

    sw.on('error', function () {
      if (port === 3282) log('[error] Default Dat port did not work (3282), using random port')
      sw.listen(0)
    })
    sw.listen(port)

    sw.on('listening', function () {
      sw.join('dat-doctor-public-peer', {announce: false})
      sw.on('connecting', function (peer) {
        debug('Trying to connect to doctor, %s:%d', peer.host, peer.port)
      })
      sw.on('peer', function (peer) {
        debug('Discovered doctor, %s:%d', peer.host, peer.port)
      })
      sw.on('connection', function (connection) {
        connected = true
        debug('Connection established to doctor')
        connection.setEncoding('utf-8')
        connection.on('data', function (remote) {
          dataEcho = true
          log(`[info] ${name.toUpperCase()} - success!`)
        })
        pump(connection, connection, function () {
          debug('Connection closed')
          destroy(cb)
        })
      })
      debug('Attempting connection to doctor, %s', doctor)
      setTimeout(function () {
        if (connected) return
        log('[error] FAIL - Connection timeout, fail.')
        destroy(cb)
      }, 10000)
      var destroy = thunky(function (cb) {
        sw.destroy(function () {
          if (!connected) {
            log('[error] FAIL - Unable to connect to public server.')
          }
          if (!dataEcho) {
            log('[error] FAIL - Data was not echoed back from public server.')
          }
          cb()
        })
      })
    })
  }

  function startP2PDNS () {
    var client = dnsDiscovery({
      servers: defaults.dns.server
    })
    
    client.on('error', function (err) {
      log('[info] dns-discovery emitted ' + err.message)
    })

    var tick = 0
    var sw = swarm({
      dns: {
        servers: defaults.dns.server
      },
      dht: false
    })

    sw.on('error', function () {
      sw.listen(0)
    })
    sw.listen(port)
    sw.on('listening', function () {
      client.whoami(function (err, me) {
        if (err) return log('[error] Could not detect public ip / port')
        log('[info] Public IP: ' + me.host)
        log('[info] Your public port was ' + (me.port ? 'consistent' : 'inconsistent') + ' across remote multiple hosts')
        if (!me.port) log('[error] Looks like you are behind a symmetric nat. Try enabling upnp.')
        client.destroy()
        sw.join(id)
        sw.on('connecting', function (peer) {
          log('[info] Trying to connect to %s:%d', peer.host, peer.port)
        })
        sw.on('peer', function (peer) {
          debug('Discovered %s:%d', peer.host, peer.port)
        })
        sw.on('connection', function (connection, info) {
          var num = tick++
          var prefix = '0000'.slice(0, -num.toString().length) + num

          var data = crypto.randomBytes(16).toString('hex')
          log('[%s-%s] Connection established to remote peer', prefix, info.type)
          var buf = ''
          connection.setEncoding('utf-8')
          connection.write(data)
          connection.on('data', function (remote) {
            buf += remote
            if (buf.length === data.length) {
              log('[%s-%s] Remote peer echoed expected data back, success!', prefix, info.type)
            }
          })
          pump(connection, connection, function () {
            log('[%s-%s] Connected closed', prefix, info.type)
          })
        })

        log('')
        log('To test p2p connectivity login to another computer and run:')
        log('')
        log('  dat doctor ' + id)
        log('')
        log('Waiting for incoming connections... (local port: %d)', sw.address().port)
        log('')
      })
    })
  }
}
