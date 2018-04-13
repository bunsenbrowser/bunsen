/**
 * DatLibrarian is a dedicated [Dat](http://datproject.org/) peer similar to
 * [hypercore-archiver](https://github.com/mafintosh/hypercore-archiver)
 * that persists archives to disk and seeds them to the network.
 *
 * @example
 *
 * const DatLibrarian = require('dat-librarian')
 * const librarian = new DatLibrarian({ dir: '.dats' })
 * librarian
 *   // load pre-existing archives
 *   .load()
 *   // promises!
 *   .then(() => {
 *     // use keys or links per dat-link-resolve
 *     return librarian.add('garbados.hashbase.io')
 *   })
 */
'use strict'

const assert = require('assert')
const Dat = require('dat-node')
const datLinkResolve = require('dat-link-resolve')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const rimraf = require('rimraf')
const { EventEmitter } = require('events')

const DAT_KEY_REGEX = /^([0-9a-f]{64})/i

function log () {
  let msg = arguments[0]
  arguments[0] = '[dat-librarian] ' + msg
  if (process.env.DEBUG || process.env.LOG) {
    console.log.apply(console, arguments)
  }
}

/**
 * Instantiate a new DatLibriarian.
 * @constructor
 * @param  {Object} options     Options object.
 * @param  {String} options.dir The librarian's working directory, where it will cache archives. Required.
 * @param  {Object} options.dat Options object passed to Dat()
 * @param  {Object} options.net Options object passed to dat.joinNetwork()
 */
class DatLibrarian extends EventEmitter {
  /**
   * Promification of dat-link-resolve
   * for convenience's sake.
   * @param  {String | Buffer} link Link to a Dat archive
   * @return {Promise<Buffer>}      Key of that Dat archive
   * @example
   *
   * DatLibrarian.resolve('garbados.hashbase.io').then((key) => {
   *   console.log(key)
   *   > 'c33bc8d7c32a6e905905efdbf21efea9ff23b00d1c3ee9aea80092eaba6c4957'
   * })
   */
  static resolve (link) {
    return new Promise(function (resolve, reject) {
      datLinkResolve(link, function (err, key) {
        if (err) return reject(err)
        else return resolve(key)
      })
    })
  }

  constructor ({ dir, dat, net }) {
    super()
    log('Creating new librarian with options %j', { dir, dat, net })
    assert(dir, 'A directory is required for storing archives.')
    this.dir = dir
    mkdirp.sync(this.dir)
    this.dats = {}
    this.netOptions = Object.assign({}, net || {})
    this.datOptions = Object.assign({}, dat || {})
  }

  /**
   * Load Dat archives into cache by checking the working
   * directory for existing archives.
   * @return {Promise<Array>} A promise that resolves once any existing archives have been loaded into the cache.
   * @example
   *
   * librarian.load().then(() => {
   *   ...
   * })
   */
  load () {
    log('Loading existing archives...')
    // search for local archives
    return new Promise((resolve, reject) => {
      fs.readdir(this.dir, (err, files) => {
        if (err) return reject(err)
        else return resolve(files)
      })
    }).then((files) => {
      const tasks = files.filter((file) => {
        return DAT_KEY_REGEX.test(file)
      }).map((key) => {
        log('Loading archive: %s', key)
        return this.add(key)
      })
      return Promise.all(tasks)
    })
  }

  /**
   * Get an archive from the cache by link.
   * @param  {String | Buffer} link Link to a Dat archive.
   * @return {Promise<Dat>}         Promise that resolves to a Dat archive.
   * @example
   *
   * librarian.get('garbados.hashbase.io').then((dat) => {
   *   ...
   * })
   */
  get (link) {
    log('Getting archive from %s', link)
    // check local cache
    if (link in this.dats) return Promise.resolve(this.dats[link])
    // resolve the link, then check the cache
    return DatLibrarian.resolve(link).then((key) => {
      if (key in this.dats) {
        log('Found archive %s in cache', link)
        return this.dats[key]
      } else {
        log('Archive %s not found', link)
        throw new Error('not found')
      }
    })
  }

  /**
   * Add an archive by link. Automatically joins the network
   * and begins downloading, but does not wait for the archive
   * to complete.
   * @param {String | Buffer} link Link to a Dat archive.
   * @return {Promise} A promise that resolves once the archive has been added to the cache.
   * @example
   *
   * librarian.add('garbados.hashbase.io').then((dat) => {
   *   ...
   * })
   */
  add (link) {
    log('Adding archive from %s', link)
    return DatLibrarian.resolve(link).then((key) => {
      if (key in this.dats) {
        log('Archive %s already in cache.', link)
        return this.dats[key]
      } else {
        return new Promise((resolve, reject) => {
          const datDir = path.join(this.dir, key)
          const datOptions = Object.assign({}, this.datOptions, { key })
          Dat(datDir, datOptions, (err, dat) => {
            if (err) return reject(err)
            this.dats[key] = dat
            dat.joinNetwork(this.netOptions, () => {
              /**
               * Event emitted once an archive has
               * completed its first round of peer discovery.
               *
               * @event join
               * @type {Dat}
               * @example
               *
               * librarian.on('join', (dat) => {
               *   ...
               * })
               */
              this.emit('join', dat)
            })
            log('Archive %s added.', link)
            /**
             * Event emitted when an archive is added.
             *
             * @event add
             * @type {Dat}
             * @example
             *
             * librarian.on('add', (dat) => {
             *   ...
             * })
             */
            this.emit('add', dat)
            return resolve(dat)
          })
        })
      }
    })
  }

  /**
   * Remove an archive from the cache and the working directory.
   * @param  {String | Buffer} link Link to a Dat archive.
   * @return {Promise} A promise that resolves once the archive has been removed.
   * @example
   *
   * librarian.remove('garbados.hashbase.io').then(() => {
   *   ...
   * })
   */
  remove (link) {
    log('Removing archive %s', link)
    return DatLibrarian.resolve(link).then((key) => {
      const dat = this.dats[key]
      // verify that the archive exists, and thus can be deleted
      if (!dat) throw new Error('not found')
      return new Promise((resolve, reject) => {
        log('Closing archive %s', link)
        dat.close((err) => {
          if (err) return reject(err)
          // remove from cache
          delete this.dats[key]
          const datDir = path.join(this.dir, key)
          log('Removing archive %s files', link)
          rimraf(datDir, (err) => {
            if (err) return reject(err)
            /**
             * Event emitted once an archive has been removed.
             *
             * @event remove
             * @type {String | Buffer} The link used to remove the archive.
             * @example
             *
             * librarian.on('remove', (link) => {
             *   ...
             * })
             */
            this.emit('remove', link)
            return resolve()
          })
        })
      })
    })
  }

  /**
   * Lists the keys in the cache.
   * @return {Array<String>} An array of all the keys in the cache.
   * @example
   *
   * let keys = librarian.list()
   * console.log(keys)
   * > ['c33bc8d7c32a6e905905efdbf21efea9ff23b00d1c3ee9aea80092eaba6c4957']
   */
  list () {
    return Object.keys(this.dats)
  }

  /**
   * Getter for the keys in the cache. Alias to #list()
   * @return {Array<String>} An array of all the keys in the cache.
   * @example
   *
   * console.log(librarian.keys)
   * > ['c33bc8d7c32a6e905905efdbf21efea9ff23b00d1c3ee9aea80092eaba6c4957']
   */
  get keys () {
    return this.list()
  }

  /**
   * Close the librarian and any archives it is peering.
   * @return {Promise} Promise that resolves once all archives have closed.
   * @example
   *
   * librarian.close().then(() => {
   *   ...
   * })
   */
  close () {
    log('Closing the librarian...')
    const tasks = Object.keys(this.dats).map((key) => {
      const dat = this.dats[key]
      return new Promise((resolve) => {
        dat.close(resolve)
      })
    })
    return Promise.all(tasks)
  }
}

module.exports = DatLibrarian
