#!/usr/bin/env bash
adb uninstall org.bunsenbrowser
adb install ./platforms/android/build/outputs/apk/android-release.apk
adb shell am start -n org.bunsenbrowser/org.bunsenbrowser.MainActivity
