#!/usr/bin/env bash
adb uninstall org.rti.sses.rcd.bunsen
cordova build android
adb install ${HOME}/source/bunsenbrowser/bunsen/platforms/android/build/outputs/apk/android-debug.apk
adb shell am start -n org.rti.sses.rcd.bunsen/org.rti.sses.rcd.bunsen.MainActivity
