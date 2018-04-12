/* global describe it before after */

const assert = require('assert')
const http = require('http')
const DatGateway = require('.')
const rimraf = require('rimraf')
const hyperdrive = require('hyperdrive')
const websocket = require('websocket-stream')
const ram = require('random-access-memory')

const dir = 'fixtures'
const ttl = 4000
const period = 1000

describe('dat-gateway', function () {
  this.timeout(0)

  before(function () {
    this.gateway = new DatGateway({ dir, ttl, period })
    return this.gateway.load().then(() => {
      return this.gateway.listen(5917)
    })
  })

  after(function () {
    return this.gateway.close().then(() => {
      rimraf.sync(dir)
    })
  })

  it('should exist', function () {
    assert.equal(this.gateway.dir, dir)
  })

  it('should handle requests', function () {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:5917/garbados.hashbase.io/icons/favicon.ico', resolve)
      req.on('error', console.log)
    }).then((res) => {
      // should display empty index, s.t. an attacker cannot determine
      assert.equal(res.statusCode, 200)
    }).catch((e) => {
      console.error(e)
      throw e
    })
  })

  it('should handle requests for dead addresses', function () {
    return new Promise((resolve) => {
      http.get('http://localhost:5917/af75142d92dd1e456cf2a7e58a37f891fe42a1e49ce2a5a7859de938e38f4642', resolve)
    }).then((res) => {
      // show blank index
      assert.equal(res.statusCode, 200)
    }).catch((e) => {
      console.error(e)
      throw e
    })
  })

  it('should proactively deleted expired archives', function () {
    return new Promise((resolve) => {
      const checker = setInterval(() => {
        // assert that they have been deleted
        if (this.gateway.keys.length === 0) {
          clearInterval(checker)
          return resolve()
        }
      }, ttl)
    })
  })

  it('should handle websockets for replication', function () {
    // Key for gardos.hashbase.io
    const key = 'c33bc8d7c32a6e905905efdbf21efea9ff23b00d1c3ee9aea80092eaba6c4957'

    const url = `ws://localhost:5917/${key}`

    let socket = null

    return new Promise((resolve, reject) => {
      const archive = hyperdrive(ram, Buffer.from(key, 'hex'))
      archive.once('error', reject)
      archive.once('ready', () => {
        socket = websocket(url)

        socket.pipe(archive.replicate({
          live: true
        })).pipe(socket)

        setTimeout(() => {
          archive.readFile('/icons/favicon.ico', (e, content) => {
            if (e) reject(e)
            else resolve(content)
          })
        }, 3000)
      })
    }).then((content) => {
      socket.end()
    }, (e) => {
      socket.end()
      console.error(e.message)
      throw e
    })
  })
})
