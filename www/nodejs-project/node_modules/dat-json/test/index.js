var fs = require('fs')
var path = require('path')
var test = require('tape')
var hyperdrive = require('hyperdrive')
var ram = require('random-access-memory')
var datJSON = require('..')

test('Default dat.json', function (t) {
  var archive = hyperdrive(ram)
  archive.ready(function () {
    var datjson = datJSON(archive)
    datjson.read(function (err) {
      t.ok(err, 'error read before write')
      datjson.create({name: 'test'}, function (err) {
        t.error(err, 'no error')

        datjson.read(function (err, data) {
          t.error(err, 'no error')
          t.ok(data, 'has metadata')
          t.same(data.url, `dat://${archive.key.toString('hex')}`)
          t.same(data.name, 'test', 'has name value')
          t.end()
        })
      })
    })
  })
})

test('Write dat.json to archive', function (t) {
  var archive = hyperdrive(ram)
  archive.ready(function () {
    var datjson = datJSON(archive)
    datjson.create(function (err) {
      t.error(err, 'no error')
      datjson.write({specialVal: 'cat'}, check)

      function check (err) {
        t.error(err, 'no error')
        datjson.read(function (err, data) {
          t.error(err, 'no error')
          t.ok(data, 'has metadata')
          t.same(data.url, `dat://${archive.key.toString('hex')}`, 'url ok')
          t.same(data.specialVal, 'cat', 'has special value')
          t.end()
        })
      }
    })
  })
})

test('Write dat.json to file and archive', function (t) {
  var archive = hyperdrive(ram)
  var file = path.join(__dirname, 'dat.json')
  archive.ready(function () {
    var datjson = datJSON(archive, {file: file})
    datjson.create(function (err) {
      t.error(err, 'no error')
      datjson.write({specialVal: 'cat'}, checkFile)

      function checkFile (err) {
        t.error(err, 'no error')
        fs.readFile(file, 'utf-8', function (err, data) {
          data = JSON.parse(data)
          t.error(err, 'fs no error')
          t.ok(data, 'fs has metadata')
          t.same(data.url, `dat://${archive.key.toString('hex')}`, 'fs url ok')
          t.same(data.specialVal, 'cat', 'fs has special value')
          fs.unlinkSync(file)
          checkRead()
        })
      }

      function checkRead (err) {
        t.error(err, 'no error')
        datjson.read(function (err, data) {
          t.error(err, 'no error')
          t.ok(data, 'has metadata')
          t.same(data.url, `dat://${archive.key.toString('hex')}`, 'url ok')
          t.same(data.specialVal, 'cat', 'has special value')
          t.end()
        })
      }
    })
  })
})
