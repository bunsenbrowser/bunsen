#!/usr/bin/env node

// this is the peer at 'doctor1.publicbits.org'

var swarm = require('discovery-swarm')
var crypto = require('crypto')
var pump = require('pump')
var defaults = require('datland-swarm-defaults')()

var sw = swarm({
  dns: {
    servers: defaults.dns.server
  },
  hash: false,
  dht: false
})

sw.on('error', function () {
  sw.listen(0)
})
sw.listen(8887)
sw.on('listening', function () {
  sw.join('dat-doctor-public-peer')
  sw.on('connecting', function (peer) {
    console.log('Trying to connect to %s:%d', peer.host, peer.port)
  })
  sw.on('peer', function (peer) {
    console.log('Discovered %s:%d', peer.host, peer.port)
  })
  sw.on('connection', function (connection) {
    var data = crypto.randomBytes(16).toString('hex')
    console.log('Connection established to remote peer')
    connection.setEncoding('utf-8')
    connection.write(data)
    connection.on('data', function (remote) {
      console.log('Got data back from peer %s', remote.toString())
      connection.destroy()
    })
    pump(connection, connection, function () {
      console.log('Connection closed')
    })
  })
  console.log('Waiting for incoming connections... (local port: %d)', sw.address().port)
})
