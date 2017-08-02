///<reference path="../typings.d.ts"/>
///<reference path="../../node_modules/cordova-node-plugin/index.d.ts"/>
import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';
// import {CordovaNodePlugin} from './CordovaNodePlugin';
// import CordovaNodePlugin = require('./CordovaNodePlugin');
// import {CordovaNodePlugin} from './CordovaNodePlugin';
// import {CordovaNodePlugin} from './CordovaNodePlugin';
// import {CordovaNodePlugin} from '../typings';
// import * as CordovaNodePlugin from 'cordova-node-module';
// import * as CordovaNodePlugin from './CordovaNodePlugin';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Bunsen';
  datUri = '';
  results: string[];
  serverUrl = 'http://localhost:8080/dat';

  ngOnInit() {
    document.addEventListener('deviceready', () => {
      console.log("deviceready");
      // console.log(cordova.file);

      // Gain access to the main user file system.
      window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, createDirs, onErrorLoadFs);

      // Create bunsen dir and copy subdirs
      function createDirs(rootDirEntry) {
        rootDirEntry.getDirectory('bunsen', { create: true }, function (entry) {
          console.log("Created dir at " + entry.toURL());
          createCopyDir(entry, 'node');
          createCopyDir(entry, 'node_modules');
        })
      }

      // create/copy dirs from assets dir.
      function createCopyDir(rootDirEntry, dir) {
        var url = cordova.file.applicationDirectory+"www/assets/" + dir;
        console.log("url: " + url)
        window.resolveLocalFileSystemURL(url, function(entry) {
            entry.copyTo(rootDirEntry, null, function(rs) {
              console.log(JSON.stringify(rs)); //success
            }, function(rs) { console.log("Error copying to " + dir + ' result:'+JSON.stringify(rs));} );
        }, function(rs) { console.log("Error in resolveLocalFileSystemURL result for " + dir + ": "+JSON.stringify(rs));} );
      }

      function onErrorLoadFs(error) {
        console.log("Error loading filesystem "+ error.code);
      }

      CordovaNodePlugin.startServer(function (result) {
        console.log('Result of starting Node: ' + result);
      }, function (err) {
        console.log(err);
      });
    }, false);
  }

  // Inject HttpClient into your component or service.
  constructor(private http: HttpClient) {}
  update(datUri: string) {
    this.datUri = datUri;
    console.log('dat datUri: ' + this.datUri);
    const body = {uri: this.datUri};
    // Make the HTTP request:
    this.http.post(this.serverUrl, body ).subscribe(data => {
      // Read the result field from the JSON response.
      // this.results = data['results'];
      // console.log("results: " + this.results)
      console.log('data: ' + data);
    });
  }
}
