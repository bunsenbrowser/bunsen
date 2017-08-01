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
      // console.log('Using Cordova plugins with Angular 2. Cordova version: ' + device.cordova);
      console.log(cordova.file);
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, createDirsFs, onErrorLoadFs);

      function createDirsFs(fs) {
        console.log('file system open: ' + fs.name);
        // var cache = getCacheDir().getAbsolutePath();
        // var jsPath = cache + "/node";
        // var corePath = cache + "/node_modules";
        var entry=fs.root;
        // entry.getDirectory("node", {create: true, exclusive: false}, onGetDirectorySuccess, onGetDirectoryFail).then(
        //   entry.getDirectory("node_modules", {create: true, exclusive: false}, onGetDirectorySuccess, onGetDirectoryFail).then(createCopyDir(fs, 'node'))
        createCopyDir(fs, 'node')
        // )
      }

      function createCopyDir(fs, dir) {
        // app.fileSystem = fs;
        var url = cordova.file.applicationDirectory+"index.js";
        console.log("url: " + url)
        window.resolveLocalFileSystemURL(url, function(entry) {
          // var fullPath = "node";
          fs.root.getDirectory(dir, {create:true, exclusive:false}, function(entryDirectory) {
            entry.copyTo(entryDirectory, dir, function(rs) {
              console.log(JSON.stringify(rs)); //success
            }, function(rs) { console.log("1 "+JSON.stringify(rs));} );
          }, function(rs) { console.log("2 "+JSON.stringify(rs));} );
        }, function(rs) { console.log("3 "+JSON.stringify(rs));} );
      }

      // window.resolveLocalFileSystemURL(cordova.file.applicationDirectory, function (dirEntry) {
      //   console.log('file system open: ' + dirEntry.name);
      //   var isAppend = true;
      //   createFile(dirEntry, "fileToAppend.txt", isAppend);
      // }, onErrorLoadFs);

      function onErrorLoadFs(error) {
        console.log("Error loading filesystem "+ error.code);
      }
      function onGetDirectorySuccess(dir) {
        console.log("Created dir: "+ dir);
      }
      function onGetDirectoryFail(error) {
        console.log("Error creating dir "+ error.code);
      }
      CordovaNodePlugin.startServer(function (result) {
        console.log('Result of starting Node: ' + result);
      }, function (err) {
        console.log(err);
      });
    // CordovaNodePlugin.startServer();
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
