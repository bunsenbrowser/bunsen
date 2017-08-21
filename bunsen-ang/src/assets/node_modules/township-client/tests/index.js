var fs = require('fs')
var path = require('path')
var test = require('tape')

var TownshipClient = require('..')
var createServer = require('./server')

var server
var address
var client
var testConfig = path.join(__dirname, 'config.txt')
fs.writeFileSync(testConfig, '')

test('start test server', function (t) {
  createServer(function (err, serv, add) {
    if (err) throw err
    server = serv
    address = add

    client = TownshipClient({
      server: address,
      config: {
        filepath: testConfig
      }
    })

    t.end()
  })
})

test('secure request before register', function (t) {
  client.secureRequest({url: '/verifytoken'}, function (err) {
    t.ok(err, 'errors')
    t.end()
  })
})

test('register', function (t) {
  client.register({email: 'joe', password: 'verysecret'}, function (err) {
    t.error(err, 'no error')
    t.pass('registers')
    t.end()
  })
})

test('login okay', function (t) {
  client.login({email: 'joe', password: 'verysecret'}, function (err) {
    t.error(err, 'no error')
    t.pass('login okay')
    t.end()
  })
})

test('secure request', function (t) {
  client.secureRequest({url: '/verifytoken'}, function (err) {
    t.error(err, 'no error')
    t.pass('secure request works')
    t.end()
  })
})

test('logout okay', function (t) {
  client.logout(function (err) {
    t.error(err, 'no error')
    t.pass('logout okay')
    t.end()
  })
})

test('logout twice okay', function (t) {
  client.logout(function (err) {
    t.error(err, 'no error')
    t.pass('logout okay')
    t.end()
  })
})

test('secure request after logout', function (t) {
  client.secureRequest({url: '/verifytoken'}, function (err) {
    t.ok(err, 'cannot do secure request after logout')
    t.end()
  })
})

test('login wrong pw', function (t) {
  client.login({email: 'joe', password: 'notsecret'}, function (err) {
    t.ok(err, 'errors')
    t.end()
  })
})

test('login wrong email', function (t) {
  client.login({email: 'notjoe', password: 'verysecret'}, function (err) {
    t.ok(err, 'errors')
    t.end()
  })
})

test('login to get token again', function (t) {
  client.login({email: 'joe', password: 'verysecret'}, function (err) {
    t.error(err, 'no error')
    t.pass('ok login after logout')
    t.end()
  })
})

test('change pw', function (t) {
  client.updatePassword({
    email: 'joe',
    password: 'verysecret',
    newPassword: 'password'
  }, function (err) {
    t.error(err, 'no error')
    t.pass('okay')
    t.end()
  })
})

test('login with new password', function (t) {
  client.login({
    email: 'joe',
    password: 'password'
  }, function (err) {
    t.error(err, 'no error')
    t.pass('okay')
    t.end()
  })
})

test('secure request with new info', function (t) {
  client.secureRequest({url: '/verifytoken'}, function (err) {
    t.error(err, 'no error')
    t.pass('secure request works')
    t.end()
  })
})

test('register another user', function (t) {
  client.register({email: 'joe@hand.email', password: 'verysecret'}, function (err, res, body) {
    t.error(err, 'no error')
    t.pass('registers')
    t.same(body.email, 'joe@hand.email', 'returns email back with request')
    t.same(body.server, address, 'returns server back with request')
    t.ok(body.token, 'returns token back with request')
    t.ok(body.key, 'returns key back with request')
    t.end()
  })
})

test('secure request with new info', function (t) {
  var clientToo = TownshipClient({
    server: address,
    routes: {
      register: '/fakeRegister'
    }
  })
  clientToo.register({email: 'joe@hand.email', password: 'verysecret'}, function (err, res, body) {
    t.ok(err, 'gets error')
    t.end()
  })
})

test.onFinish(function () {
  server.close(function () {
    fs.unlink(testConfig, function () {
      // good bye
    })
  })
})
