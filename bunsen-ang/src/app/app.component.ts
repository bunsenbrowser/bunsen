///<reference path="../typings.d.ts"/>
///<reference path="../../node_modules/cordova-node-plugin/index.d.ts"/>
import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Bunsen';
  datUri = '';
  results: string[];
  serverUrl = 'http://localhost:8080/';
  serverDatUrl = this.serverUrl + 'dat/';
  responseData = '';

  ngOnInit() {
    document.addEventListener('deviceready', () => {
      console.log("deviceready");
      // console.log(cordova.file);

      startNodeServer();

      function startNodeServer() {
        CordovaNodePlugin.startServer(function (result) {
          console.log('Result of starting Node: ' + result);
        }, function (err) {
          console.log(err);
        });
      }

    }, false);
  }

  // Inject HttpClient into your component or service.
  constructor(private http: HttpClient) {}

  update(datUri: string) {
    this.datUri = datUri;
    console.log('dat datUri: ' + this.datUri);
    const body = {uri: this.datUri};
    var url = this.serverDatUrl + this.datUri;
    // Make the HTTP request:
    this.http.get(url, {observe: 'response'}).subscribe(data => {
      // Read the result field from the JSON response.
      // this.results = data['results'];
      // console.log("results: " + this.results)
      console.log('url: ' + url + ' data: ' + JSON.stringify(data));
      this.responseData = JSON.stringify(data);
      window.location.href=this.serverUrl;
    });
  }
}
