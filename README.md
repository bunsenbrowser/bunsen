# Bunsen

Bunsen is a front-end for dat. It is a Cordova app that renders an Angular 4 app. It creates Android APK's.

## Development

Kudos to https://www.becompany.ch/en/blog/2016/10/19/creating-apache-cordova-app-with-angular2 for the primer on running an Angular app inside Cordova.

Modify scripts/prepareAngular2App.js if path to your Angular app changes.

To deploy to a connected android device, run installapp.sh.  Modify installapp.js to suit your paths.

### Bunsen-ang

The Angular webapp is inside bunsen-ang directory. To develop, cd to that dir and `ng serve`

### Bunsen-server

In development, launch the bunsen-server using `npm start`. It listens on port 8080.

To deploy, copy to your termux directory and run.

### Dev notes

Much of this app was created using the Angular CLI. Some sample commands:

````
ng g m discovery --routing
ng g c discovery -m discovery.module
ng g m discovery -m app.module --routing

````

The discovery component is currently unused; it was an experiment in bootstrapping a node.js app.
Not yet ready (if ever!)

