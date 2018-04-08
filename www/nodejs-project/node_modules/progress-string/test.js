'use strict'

var test = require('tape')
var progress = require('./')

test('no options', function (t) {
  t.throws(function () {
    progress()
  })
  t.end()
})

test('empty options object', function (t) {
  t.throws(function () {
    progress({})
  })
  t.end()
})

test('opts.total === 0', function (t) {
  t.doesNotThrow(function () {
    progress({total: 0})
  })
  t.end()
})

test('0 of 0', function (t) {
  var bar = progress({width: 10, total: 0})
  t.equal(bar(1), '==========')
  t.end()
})

test('1 of 0', function (t) {
  var bar = progress({width: 10, total: 0})
  t.equal(bar(1), '==========')
  t.end()
})

test('0% of 100', function (t) {
  var bar = progress({width: 10, total: 100})
  t.equal(bar(0), '----------')
  t.end()
})

test('1% of 100', function (t) {
  var bar = progress({width: 10, total: 100})
  t.equal(bar(1), '----------')
  t.end()
})

test('50% of 100', function (t) {
  var bar = progress({width: 10, total: 100})
  t.equal(bar(50), '=====-----')
  t.end()
})

test('99% of 100', function (t) {
  var bar = progress({width: 10, total: 100})
  t.equal(bar(99), '=========-')
  t.end()
})

test('100% of 100', function (t) {
  var bar = progress({width: 10, total: 100})
  t.equal(bar(100), '==========')
  t.end()
})

test('custom chars', function (t) {
  var bar = progress({width: 10, total: 100, incomplete: '*', complete: '#'})
  t.equal(bar(50), '#####*****')
  t.end()
})

test('options.style', function (t) {
  var bar = progress({width: 10, total: 100, style: style})
  t.equal(bar(50), '=====>-----')
  t.end()

  function style (complete, incomplete) {
    return complete + '>' + incomplete
  }
})
