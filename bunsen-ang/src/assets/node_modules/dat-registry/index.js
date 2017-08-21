var Township = require('township-client')
var qs = require('querystring')
var nets = require('nets')
var xtend = require('xtend')

module.exports = API

function API (opts) {
  if (!(this instanceof API)) return new API(opts)
  if (!opts) opts = {}
  if (!opts.apiPath) opts.apiPath = ''

  // datproject.org defaults, specify opts.server and opts.apiPath to override
  var SERVER = 'https://datproject.org'
  var API_PATH = '/api/v1'

  var apiPath = !opts.server || (opts.server.indexOf('datproject.org') > -1) ? API_PATH : opts.apiPath // only add default path to datproject.org server
  var townshipOpts = Object.assign({}, opts)

  // set default township server & routes for datproject.org
  if (!townshipOpts.config) townshipOpts.config = {}
  if (!townshipOpts.config.filename) townshipOpts.config.filename = '.datrc'
  if (!townshipOpts.server) townshipOpts.server = SERVER
  if (!opts.routes && apiPath) {
    townshipOpts.routes = {
      register: apiPath + '/register',
      login: apiPath + '/login',
      updatePassword: apiPath + '/updatepassword'
    }
  }

  var township = Township(townshipOpts)
  var api = township.server + apiPath // let township parse server

  return {
    login: township.login.bind(township),
    logout: township.logout.bind(township),
    register: township.register.bind(township),
    whoami: township.getLogin.bind(township),
    secureRequest: township.secureRequest.bind(township),
    dats: rest('/dats'),
    users: xtend(rest('/users'), {
      resetPassword: function (input, cb) {
        nets({method: 'POST', uri: api + '/password-reset', body: input, json: true}, cb)
      },
      resetPasswordConfirmation: function (input, cb) {
        nets({method: 'POST', uri: api + '/password-reset-confirm', body: input, json: true}, cb)
      },
      suspend: function (input, cb) {
        nets({method: 'PUT', uri: api + '/users/suspend', body: input, json: true}, cb)
      }
    })
  }

  function rest (path) {
    var defaults = {
      uri: api + path,
      json: true
    }
    return {
      get: function (input, cb) {
        var params = qs.stringify(input)
        var opts = Object.assign({}, defaults)
        opts.uri = defaults.uri + '?' + params
        opts.method = 'GET'
        township.secureRequest(opts, cb)
      },
      create: function (input, cb) {
        var opts = Object.assign({}, defaults)
        opts.body = input
        opts.method = 'POST'
        township.secureRequest(opts, cb)
      },
      update: function (input, cb) {
        var opts = Object.assign({}, defaults)
        opts.body = input
        opts.method = 'PUT'
        township.secureRequest(opts, cb)
      },
      delete: function (input, cb) {
        var opts = Object.assign({}, defaults)
        opts.body = input
        opts.method = 'DELETE'
        township.secureRequest(opts, cb)
      }
    }
  }
}
