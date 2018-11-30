# Bunsen

![bunsen logo](bunsen-logo.png)

Bunsen is a front-end for [dat](https://datproject.org/) using Apache Cordova to render an app that performs dat functions for sharing and consuming network resources. This project current creates Android APK's, but could support iOS someday.

[![Image of Bunsen Browser displaying a portal](docs/images/bunsen_browser_home.png)](docs/images/bunsen_browser_home_large.png)

## Download

Current version: [1.1.3](https://github.com/bunsenbrowser/bunsen/releases/tag/1.1.3). 
- [Play store](https://play.google.com/store/apps/details?id=org.bunsenbrowser) 
- [GitHub](https://github.com/bunsenbrowser/bunsen/releases/download/1.1.3/bunsen-1.1.3.apk) direct download
- [dat://bunsen-apk.hashbase.io](dat://bunsen-apk.hashbase.io) 
- [raw dat installer link](dat://4dc3f50557b0a9e28f94356cae1050c7d9a4205d0b0622340742e481d0cb25b5/)

Version 1.1.3 - Create simple Dat apps using DatArchive API

Bunsen now has basic DatArchive support, which enables you to create, read, get Info, and write files to a DatArchive. 
Sharing these dats is still a work-in-progress. 

[More details...](https://github.com/bunsenbrowser/bunsen/releases/tag/1.1.3)

[Release History](https://github.com/bunsenbrowser/bunsen/wiki/Bunsen-Releases)

## How to use Bunsen

Bunsen is currently very alpha-quality software. It runs on mobile devices runnning ARMv7a and x86 processors such as Nexus 5X and Pixel 2. The wiki has more info on [Device Testing](https://github.com/bunsenbrowser/bunsen/wiki/Device-testing).

To install Bunsen, start by going to your Android Device's Settings App. Then open "Security" and then enable "Unknown Sources". Then download Bunsen from the Download link above to your Android device, open it from the menu tray, and then give it permission to install.

When Bunsen starts, it will display a loading dialog for about ten seconds while the node express server launches and it fetches the Bunsen Ui, which itself is a dat!

Bunsen will load and display a single dat when you enter the dat address (with dat://) and press the enter button.

To load another dat, enter a new address or select a dat from the history, which is listed below the input box when you are typing in it.

Bunsen will open sites with links to dats (`a href=dat://`) too. Check out [hashbase.io](http://hashbase.io) for a list of sites.

In the background, Bunsen will share the dat you have loaded.

For more information, there is a [walkthrough](https://github.com/bunsenbrowser/bunsen/wiki/Bunsen-Walkthrough) with (outdated) screenshots.

## What is dat?
You could say that dat is a distributed data sharing tool that uses p2p peers like bittorrent, except it's live, so you can update the content easily. Kudos to aldebrn and mafintosh for that description.

## Development

Here's our [Roadmap](https://github.com/bunsenbrowser/bunsen/wiki/Roadmap).

### Develop on your local machine

#### Compilation and Installation on Device

Requirements:
- Node.js and npm
  - On Mac and Windows, go to http://nodejs.org and download the LATEST installer version listed on the homepage of http://nodejs.org
- `adb` which is included as a binary in android-platform-tools.
  - On Mac, easiest way to install is using brew package manager `brew cask install android-platform-tools`
  - On Ubuntu, easiest way is `sudo apt install android-tools-adb android-tools-fastboot`
- Enable USB debugging on your Android device. https://www.howtogeek.com/129728/how-to-access-the-developer-options-menu-and-enable-usb-debugging-on-android-4.2/

Run the following to build the app.
```
npm install -g cordova@7.1.0
git clone git@github.com:bunsenbrowser/bunsen
cd bunsen
npm install
cd ./www/nodejs-project
npm install
cd ../..
cordova build android
```

If you use cordova 8.x, note that you must add the android platform using
`cordova platform add android@6.4.0`. That's already taken care of in the postinstall.sh script when you do an `npm install` - 
but just in case you need to do it manually.

Although Android Studio includes Gradle, you still may also need to install gradle

`brew install gradle`

To install on an Android device, you may use the `./installapp.sh` script

#### Web UI and node app development

If you need to develop the web UI, you will need to start two services, the Server and the shell UI in two different terminals.

In the first terminal, run the local gateway.
```
cd www/nodejs-project
npm start
```

In the second terminal, start the process to serve the shell html:

```
cd www/shell
simplehttpserver
```

Access the app at http://localhost:8000

If you are working on enabling any of the dependent dat apps, share those as well:

```
cd dat-wysiwywiki-app
dat share
```

The bunsen-datArchive-test (https://github.com/bunsenbrowser/bunsen-datArchive-test) provides tests for Bunsen's DatArchive API
which can be helpful in developing dat applications that can be used with Bunsen and Beaker browser.

#### Releasing APK's

Cordova is built on the Cordova platform, which can be a difficult friend sometimes. Sometimes the nodejs-mobile-cordova plugin doesn't want to load properly. Run the `refresh.sh` script to fix things. It removes/installs the android platform and the nodejs-mobile-cordova plugin.

Before generating a release APK, copy build-template.json to build.json and fill out the necessary information. Useful information in the Cordova docs on [signing an App](https://cordova.apache.org/docs/en/latest/guide/platforms/android/#signing-an-app). If you need to setup your key and keystore, the Android Studio docs have the steps in [sign an APK](https://developer.android.com/studio/publish/app-signing.html#sign-apk)

I usually run `cordova build` and then `./refresh.sh` before generating an APK.

- To release a debug apk, run `debug_generate_apk.sh`
- To release a release apk, run `release_generate_apk.sh`


## Architecture
Bunsen consists of a UI App that is the chrome of the browser and an iframe that points at a Dat Server to display the requested Dat. When a user enters a Dat into the bar, it contacts the Dat Server by sending a GET request to `https://localhost:8080/dat/<dat UUID>`, waits until it is ready, and then displays an iframe that points to `https://localhost:8080/` where the backend Dat server that is serving the downloaded Dat.

The location of the UI is at `./bunsen-ang/` while the location of the Dat Server is at `./www/nodejs-project/`.

The Cordova application depends on the [nodejs-mobile-cordova](https://github.com/janeasystems/nodejs-mobile-cordova)
to provide the node instance. nodejs-mobile-cordova supports ARMv7a and x86 CPU architectures on Android and also supports IOS as well. 

Thanks a lot, [Janea Systems](http://www.janeasystems.com/)!

The node_modules packages have been compiled in termux on a Nexus 5X.

## Why do we need Bunsen Browser?

### Websites that scale with the demand
When you view a Dat site, you help host it. This democratizes the Internet so as demand increases, so does your hosting. You do not need expensive hosting or advertising to support your voice.

### Millions of people use the "offline web" but cannot trust its content, Bunsen and Dat solve this

Note: This use case is currently impeded by this bug (https://github.com/bunsenbrowser/bunsen/issues/60). Volunteers are encouraged to jump in.

Millions of people living under repressive regimes are blocked from the Internet and depend on outside access to digital content by way of smuggled USB Flash Drives. There are 6 billion people offline who have are offline and not able to verify content they receive while offline causing issues around misinformation, land rights, forged medical data, and many others.

Bunsen uses Dat to shine a light on the offline web by solving two problems.

1. How to easily update and merge content between two devices while offline.
2. How to verify content came from the source it claims to come from.

To understand how that works, a quick analogy about cryptographic keys.

In "Cryptoland", anyone can generate two unique magic key pairs. One key can lock anything it touches, another unlocks anything it touches. These are referred to as "private" and "public" keys. If you want someone to verify a package you send them, you give them a copy of the public key that unlocks things. Before you send your package you lock it with your private key. Now when people receive a package from you, they unlock it with the public key you gave them and they know it definitely came from you because you are the only person in the world that could have locked that package.

This is one feature of SSL/HTTPS in browsers online. When you go to https://nytimes.com, your browser uses NY Times public key to verify that the web page came from the New York Times and was not intercepted and modified somewhere along the way by some misguided government or criminal.

But there's no SSL in the offline world. We distribute applications and files over USB drives and when a person opens them up, they have no user-friendly way of verifying that content came from who they hope it came from. Bunsen makes this user friendly because it can sync and open Dat archives.

When you are online, you access Dat archives online using their dat address (dat://....). The same address is the public key. That Dat public key is then used to verify that all of the contents are locked by the person with the magic locking key, similar to SSL/HTTPS. Unlike most websites, a user can chose to save that website into their Bunsen Browser for use offline. When they are offline, using their Bunsen browsers they can send that same Dat archive to other devices running Bunsen. This allows offline verification that content came from where it claims to have come from.

To illustrate this point, here's an example:

> Jane and Sally are online separately at some point and download a Dat archive of the New York Times website. Then Sally goes out into the field where there is not Internet access. Meanwhile Jane is home the next day in the city where there is Internet access and her Bunsen browser gets the day's updates of the NY Times Dat Archive. Now Jane goes out into the field to join Sally where there is no Internet. Their Bunsen browsers connect to each other wirelessly without Internet and Sally's Bunsen browser sees there is an update of the NY Times Dat Archive on Jane's device. Sally's Bunsen browser transfers the update and Bunsen Browser using Dat automatically verifies all updates came from the NY Times using the public key.
In order to get verified content, they spend less money going online as the same content does not need to be downloaded from the Internet on every device, it's easily synced and verified using Bunsen.

In that example, perhaps Jane and Sally don't even know each other. They can still trust that when they receive updates for their Dat archives, it came from the actual source.

## Credit
- Bunsen would not be here without the leadership and hard work of the folks behind Dat (https://datproject.org/) and Beaker Browser (beakerbrowser.com):  Paul Frazee (@pfrazee), Tara Vancil (@taravancil), Mathias Buus (@mafintosh), Max Ogden (@maxogden) and many other clever and creative folks. Thank you!!!
- The lead Bunsen developers are Chris Kelley @chrisekelley and R.J. Steinert @rjsteinert
- Another shout out to @RangerMauve for [dat-archive](https://github.com/RangerMauve/dat-gateway), which enables Bunsen to store dats as subdomains, enabling cookies tied to dats and better security for Bunsen.
- Thanks to Ben Davis for providing the original Bunsen image for the logo. https://thenounproject.com/search/?q=bunsen&i=490710
- Many thanks to @mafintosh for leading the way with [node-on-android](https://github.com/node-on-mobile/node-on-android). This project used to depend on the node shared library his project provides, and it was the only way for us to get started. 
