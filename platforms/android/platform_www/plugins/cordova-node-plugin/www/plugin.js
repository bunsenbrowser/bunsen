cordova.define("cordova-node-plugin.CordovaNodePlugin", function(require, exports, module) {

var exec = require('cordova/exec');

var PLUGIN_NAME = 'CordovaNodePlugin';

var CordovaNodePlugin = {
  echo: function(phrase, cb) {
    exec(cb, null, PLUGIN_NAME, 'echo', [phrase]);
  },
  getDate: function(cb) {
    exec(cb, null, PLUGIN_NAME, 'getDate', []);
  },
  startServer: function(cb) {
    exec(cb, null, PLUGIN_NAME, 'startServer', []);
  }
};

module.exports = CordovaNodePlugin;

});
