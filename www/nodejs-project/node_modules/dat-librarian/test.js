/* global describe, it, before, after */

'use strict'

const assert = require('assert')
const DatLibrarian = require('.')
const rimraf = require('rimraf')
const { name, version } = require('./package.json')

describe([name, version].join(' @ '), function () {
  this.timeout(0) // haha, THE NETWORK
  const dir = 'fixtures'
  const link = 'garbados.hashbase.io'

  before(function () {
    this.librarian = new DatLibrarian({ dir })
  })

  after(function () {
    return this.librarian.close().then(() => {
      rimraf.sync(dir)
    })
  })

  it('should exist', function () {
    assert(this.librarian)
  })

  it('should handle new archives by link', function () {
    return this.librarian.add(link)
  })

  it('should have the new archive in its cache', function () {
    return this.librarian.get(link).then((archive) => {
      const key = archive.key.toString('hex')
      assert(this.librarian.keys.includes(key))
    })
  })

  it('should fail to retrieve archives it has not got', function () {
    // provide a valid link that is not in the cache
    return this.librarian.get('pfrazee.hashbase.io')
      .then(() => {
        throw new Error('electron is a strange omen')
      })
      .catch((e) => {
        assert.equal(e.message, 'not found')
      })
  })

  it('should remove the archive', function () {
    return this.librarian.remove(link).then(() => {
      assert.equal(this.librarian.keys.length, 0)
    })
  })

  it('should re-add, close, and re-load', function () {
    return this.librarian.add(link).then(() => {
      return this.librarian.close()
    }).then(() => {
      return this.librarian.load()
    }).then(() => {
      assert.equal(this.librarian.keys.length, 1)
    })
  })
})
