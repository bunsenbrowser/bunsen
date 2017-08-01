cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "id": "cordova-node-plugin.CordovaNodePlugin",
        "file": "plugins/cordova-node-plugin/www/plugin.js",
        "pluginId": "cordova-node-plugin",
        "clobbers": [
            "CordovaNodePlugin"
        ]
    },
    {
        "id": "cordova-plugin-hello-c.helloc",
        "file": "plugins/cordova-plugin-hello-c/www/helloc.js",
        "pluginId": "cordova-plugin-hello-c",
        "clobbers": [
            "helloc"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-node-plugin": "1.0.0",
    "cordova-plugin-hello-c": "1.0.0",
    "cordova-plugin-whitelist": "1.3.2"
};
// BOTTOM OF METADATA
});