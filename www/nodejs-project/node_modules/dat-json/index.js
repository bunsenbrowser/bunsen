var stringKey = require('dat-encoding').toStr
// var path = require('path')
var xtend = require('xtend')
var toiletdb = require('toiletdb')

module.exports = function (archive, opts) {
  if (!opts) opts = {}

  var db = toiletdb({name: '/dat.json', fs: archive})
  var fileDb = opts.file ? toiletdb(opts.file) : null

  var that = {
    read: function (cb) {
      archive.stat('/dat.json', function (err, stat) {
        if (err) return cb(err)
        db.read(cb)
      })
    },
    write: function (key, val, cb) {
      if (!archive.writable) return cb(new Error('Archive not writable'))
      if (typeof key === 'object') return writeAll(key, val) // assume val = cb
      // TODO: validate things
      if (!fileDb) return db.write(key, val, cb)

      // write to file then archive
      // TODO: use hyperdrive indexing false option, need to talk to mafintosh about
      //   https://botbot.me/freenode/dat/2017-05-12/?msg=85554242&page=3
      fileDb.write(key, val, function (err) {
        if (err) return cb(err)
        db.write(key, val, cb)
      })
    },
    delete: db.delete,
    create: function (data, cb) {
      if (typeof data === 'function') return that.create(null, data)
      if (!archive.writable) return cb(new Error('Archive not writable'))
      data = xtend(getdefaults(), data)
      that.write(data, cb)
    }
  }

  return that

  function getdefaults () {
    return {
      title: '',
      description: '',
      url: 'dat://' + stringKey(archive.key)
    }
  }

  function writeAll (data, cb) {
    if (!archive.writable) return cb(new Error('Archive not writable'))
    var keys = Object.keys(data)
    var pending = keys.length
    keys.map(function (key) {
      that.write(key, data[key], function (err) {
        if (err) return cb(err)
        if (!--pending) return cb()
      })
    })
  }
}
