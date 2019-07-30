#!/usr/bin/env bash
git pull
cordova prepare android
./debug_generate_apk.sh
