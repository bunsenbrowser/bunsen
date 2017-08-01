cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "id": "cordova-plugin-device.device",
        "file": "plugins/cordova-plugin-device/www/device.js",
        "pluginId": "cordova-plugin-device",
        "clobbers": [
            "device"
        ]
    },
    {
        "id": "cordova-node-plugin.CordovaNodePlugin",
        "file": "plugins/cordova-node-plugin/www/plugin.js",
        "pluginId": "cordova-node-plugin",
        "clobbers": [
            "CordovaNodePlugin"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-device": "1.1.6",
    "cordova-plugin-whitelist": "1.3.2",
    "cordova-node-plugin": "1.0.0"
};
// BOTTOM OF METADATA
});