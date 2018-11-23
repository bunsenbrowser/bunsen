#!/usr/bin/env bash
cordova platform remove android
cordova platform add android@6.4.0
cordova plugin remove nodejs-mobile-cordova
cordova plugin add nodejs-mobile-cordova