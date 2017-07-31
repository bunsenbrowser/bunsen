# Bunsen

![bunsen logo](bunsen-logo.png)

Bunsen is a front-end for [dat](https://datproject.org/) using Apache Cordova to render an Angular 4 app that performs dat functions for sharing and consuming network resources. This project current creates Android APK's, but could support IOS someday. 
This repo also contains bunsen-server, which you may install on your Android device to listen for incoming dat uri's.

## What is dat?

You could say that dat is a distributed data sharing tool that uses p2p peers like bittorrent, except it's live, so you can update the content easily. Kudos to aldebrn and mafintosh for that description.

## Development

Kudos to https://www.becompany.ch/en/blog/2016/10/19/creating-apache-cordova-app-with-angular2 for the primer on running an Angular app inside Cordova.

Modify scripts/prepareAngular2App.js if path to your Angular app changes.

To deploy to a connected android device, run installapp.sh.  Modify installapp.js to suit your paths.

### Bunsen-ang

The Angular webapp is inside bunsen-ang directory. To develop, cd to that dir and `ng serve`

### Bunsen-server

In development, launch the bunsen-server using `npm start`. It listens on port 8080.

Bunsen-server will run on an Android device that has installed [Termux](https://termux.com).

Setup your Android device according to the instructions [here](https://medium.freecodecamp.org/building-a-node-js-application-on-android-part-1-termux-vim-and-node-js-dfa90c28958f)

To deploy, copy to your termux directory and run `npm start`.

### Dev notes

I added a skeleton Cordova plugin

 `cordova plugin add --link ../cordova-plugin-node`

Much of this app was created using the Angular CLI. Some sample commands:

````
ng g m discovery --routing
ng g c discovery -m discovery.module
ng g m discovery -m app.module --routing

````

The discovery component is currently unused; it was an experiment in bootstrapping a node.js app.
Not yet ready (if ever!)

## Credit
Thanks to Ben Davis for providing the original Bunsen image for the logo. https://thenounproject.com/search/?q=bunsen&i=490710

