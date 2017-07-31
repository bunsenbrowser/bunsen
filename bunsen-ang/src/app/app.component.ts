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
      console.log('Using Cordova plugins with Angular 2. Cordova version: ' + device.cordova);
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
