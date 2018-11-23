adb uninstall org.bunsenbrowser

export ORG_GRADLE_PROJECT_cdvMinSdkVersion=23
export ORG_GRADLE_PROJECT_cdvCompileSdkVersion=android-26
export CORDOVA_ANDROID_GRADLE_DISTRIBUTION_URL=http\\://services.gradle.org/distributions/gradle-4.6-all.zip

cordova run android --debug -- --buildConfig build.json