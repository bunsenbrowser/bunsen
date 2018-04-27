'use strict'

const DatLibrarian = require('dat-librarian')
const fs = require('fs')
const http = require('http')
const hyperdriveHttp = require('hyperdrive-http')
const path = require('path')
const Websocket = require('websocket-stream')
const url = require('url')
const hexTo32 = require('hex-to-32')

const BASE_32_KEY_LENGTH = 52

function log () {
  let msg = arguments[0]
  arguments[0] = '[dat-gateway] ' + msg
  if (process.env.DEBUG || process.env.LOG) {
    console.log.apply(console, arguments)
  }
}

module.exports =
class DatGateway extends DatLibrarian {
  constructor({ dir, dat, max, net, period, ttl, redirect }) {
    dat = dat || {}
    if (typeof dat.temp === 'undefined') {
      dat.temp = dat.temp || true // store dats in memory only
    }
    super({ dir, dat, net })
    this.redirect = redirect
    this.max = max
    this.ttl = ttl
    this.period = period
    this.lru = {}
    if (this.ttl && this.period) {
      this.cleaner = setInterval(() => {
        log('Checking for expired archives...')
        const tasks = Object.keys(this.dats).filter((key) => {
          const now = Date.now()
          let lastRead = this.lru[key]
          return (lastRead && ((now - lastRead) > this.ttl))
        }).map((key) => {
          log('Deleting expired archive %s', key)
          delete this.lru[key]
          return this.remove(key)
        })
        return Promise.all(tasks)
      }, this.period)
    }
  }

  load () {
    log('Setting up...')
    return this.getHandler().then((handler) => {
      log('Setting up server...')
      this.server = http.createServer(handler)
      const websocketHandler = this.getWebsocketHandler()
      this.websocketServer = Websocket.createServer({
        perMessageDeflate: false,
        server: this.server
      }, websocketHandler)
    }).then(() => {
      log('Loading pre-existing archives...')
      // load pre-existing archives
      return super.load()
    })
  }

  /**
   * Promisification of server.listen()
   * @param  {Number} port Port to listen on.
   * @return {Promise}     Promise that resolves once the server has started listening.
   */
  listen (port) {
    return new Promise((resolve, reject) => {
      this.server.listen(port, (err) => {
        if (err) return reject(err)
        else return resolve()
      })
    })
  }

  close () {
    if (this.cleaner) clearInterval(this.cleaner)
    return new Promise((resolve) => {
      if (this.server) this.server.close(resolve)
      else resolve()
    }).then(() => {
      return super.close()
    })
  }

  getIndexHtml () {
    return new Promise((resolve, reject) => {
      let filePath = path.join(__dirname, 'index.html')
      fs.readFile(filePath, 'utf-8', (err, html) => {
        if (err) return reject(err)
        else return resolve(html)
      })
    })
  }

  getWebsocketHandler () {
    return (stream, req) => {
      const urlParts = req.url.split('/')
      const address = urlParts[1]
      if (!address) {
        stream.end('Must provide archive key')
        return Promise.resolve()
      }
      if (address === 'peers') {
        Object.keys(this.dats).forEach((key) => {
          let dat = this.dats[key]
          let connections = dat.network.connections.length
          try {
            stream.write(key + ':' + connections)
          } catch (e) {
            console.log('Error with websocket: ' + e)
          }
        })
      } else {
        return this.add(address).then((dat) => {
          const archive = dat.archive
          stream.pipe(archive.replicate({
            live: true
          })).pipe(stream)
        }).catch((e) => {
          stream.end(e.message)
        })
      }
    }
  }

  getHandler () {
    return this.getIndexHtml().then((welcome) => {
      return (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        const start = Date.now()
        // TODO redirect /:key to /:key/
        let requestURL = `http://${req.headers.host}${req.url}`
        let urlParts = url.parse(requestURL)
        let pathParts = urlParts.pathname.split('/').slice(1)
        let hostnameParts = urlParts.hostname.split('.')

        let subdomain = hostnameParts[0]
        let isRedirecting = this.redirect && (subdomain.length === BASE_32_KEY_LENGTH)

        let address = isRedirecting ? hexTo32.decode(subdomain) : pathParts[0];
        let path = (isRedirecting ? pathParts : pathParts.slice(1)).join('/')

        log('[%s] %s %s', address, req.method, path)

        // return index
        if (!isRedirecting && !address) {
          res.writeHead(200)
          res.end(welcome)
          return Promise.resolve()
        }

        // redirect to subdomain
        if (!isRedirecting && this.redirect) {
          return this.resolveName(address).then((resolvedAddress) => {
            // TODO: Detect DatDNS addresses
            let encodedAddress = hexTo32.encode(resolvedAddress)
            let redirectURL = `http://${encodedAddress}.${urlParts.hostname}:${this.server.address().port}/${path}${urlParts.search||''}`

            log('Redirecting %s to %s', address, redirectURL)
            res.setHeader('Location', redirectURL)
            res.writeHead(302)
            res.end();
          })
        }

        // Return a Dat DNS entry without fetching it from the archive
        if (path === '.well-known/dat') {
          return this.resolveName(address).then((resolvedAddress) => {
            log('Resolving address %s to %s', address, resolvedAddress)
            
            res.writeHead(200)
            res.end(`dat://${resolvedAddress}\nttl=3600`)
          })
        }

        // return the archive
        return this.add(address).then((dat) => {
          // handle it!!
          const end = Date.now()
          log('[%s] %s %s | OK [%i ms]', address, req.method, path, end - start)
          req.url = `/${path}`
          dat.onrequest(req, res)
        }).catch((e) => {
          const end = Date.now()
          log('[%s] %s %s | ERROR %s [%i ms]', address, req.method, path, e.message, end - start)
          if (e.message.indexOf('not found') > -1) {
            res.writeHead(404)
            res.end('Not found')
          } else {
            res.writeHead(500)
            res.end(JSON.stringify(e))
          }
        })
      }
    })
  }

  resolveName (address) {
    if (address.length === 64) return Promise.resolve(address)
    return this.add(address).then((dat) => dat.archive.key.toString('hex'))
  }

  add () {
    if (this.keys.length >= this.max) {
      const error = new Error('Cache is full. Cannot add more archives.')
      return Promise.reject(error)
    }
    return super.add.apply(this, arguments).then((dat) => {
      log('Adding HTTP handler to archive...')
      if (!dat.onrequest) dat.onrequest = hyperdriveHttp(dat.archive, { live: true, exposeHeaders: true })
      return new Promise((resolve) => {
        /*
        Wait for the archive to populate OR for 3s to pass,
        so that addresses for archives which don't exist
        don't hold us up all night.
         */
        let isDone = false
        const done = () => {
          if (isDone) return null
          isDone = true
          const key = dat.archive.key.toString('hex')
          this.lru[key] = Date.now()
          return resolve(dat)
        }
        dat.archive.metadata.update(1, done)
        setTimeout(done, 3000)
      })
    })
  }
}
