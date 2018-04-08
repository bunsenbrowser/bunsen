var fs = require('fs')
var path = require('path')
var homedir = require('os-homedir')
var isNumber = require('is-number')
var isString = require('is-string')

module.exports = Config

function Config (opts) {
  if (!(this instanceof Config)) return new Config(opts)
  opts = opts || {}
  this.filename = opts.filename || '.townshiprc'
  this.filepath = opts.filepath || path.join(homedir(), this.filename)
  return this
}

Config.prototype.init = function () {
  var self = this
  if (self.read()) {
    return
  } else {
    self.write({
      currentLogin: null,
      logins: []
    })
  }
}

Config.prototype.read = function () {
  var self = this
  var file

  try {
    file = fs.readFileSync(self.filepath, 'utf8')
  } catch (err) {
    // file not found
  }

  if (!file || file instanceof Error) return false
  return JSON.parse(file)
}

Config.prototype.write = function (data) {
  var self = this
  var file = JSON.stringify(data, true, 2)
  fs.writeFileSync(self.filepath, file)
}

Config.prototype.get = function (key) {
  var self = this
  var data = self.read()
  if (!key) return data

  var keys = self._parseKeys(key)
  var current = keys[0]
  if (keys.length === 1) return data[current]
}

Config.prototype.set = function (key, val) {
  var self = this
  var data = self.read()
  var keys = self._parseKeys(key)
  var current = keys[0]

  if (keys.length === 1) {
    data[current] = val
    self.write(data)
  }
}

Config.prototype.getLogin = function (server) {
  var self = this
  var logins = self.get('logins') || []

  if (!server) {
    return self.get('currentLogin')
  }

  var login = logins.find(function (item) {
    if (item === null) return
    return item.server === server
  })

  if (!login) return false
  login.server = server
  return login
}

Config.prototype.setLogin = function (opts) {
  var self = this
  var logins = self.get('logins') || []
  var found = false

  logins = logins.map(function (login) {
    if (login === null) return
    if (login.server === opts.server) {
      found = true
      return opts
    }
  })

  if (!found) {
    logins.push(opts)
  }

  self.set('logins', logins)
  self.set('currentLogin', opts)
  return opts
}

Config.prototype._parseKeys = function (key) {
  if (isString(key)) {
    var keys = key.split('.').map(function (key) {
      if (isNumber(key)) return parseInt(key)
      return key
    })
    return keys
  }
  return key
}
