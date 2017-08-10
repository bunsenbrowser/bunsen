///<reference path="../typings.d.ts"/>
///<reference path="../../node_modules/cordova-node-plugin/index.d.ts"/>
import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {MdDialog, MdDialogRef} from '@angular/material';
import {DialogComponent} from './dialog/dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  url: '';
  title = 'Bunsen';
  datUri = '';
  results: string[];
  serverUrl = 'http://localhost:8080/';
  serverDatUrl = this.serverUrl + 'dat/';
  responseData = '';
  datUrl: SafeResourceUrl;

  // Inject HttpClient into your component or service.
  constructor(private http: HttpClient, private sanitizer: DomSanitizer, public dialog: MdDialog) {
    this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl);
  }

  @Input('mdMenuTriggerFor')
  @Input() size: number = 50;
  @Input() show: boolean;
  @ViewChild('iframe') iframe: ElementRef;

  ngOnInit() {
    document.addEventListener('deviceready', () => {
      console.log('deviceready');
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

  update(datUri: string) {
    // this.toggleSpinner();
    // (document.querySelector('#progressSpinner') as HTMLElement).style.display = "block";
    let dialogRef = this.dialog.open(DialogComponent);
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
      this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl);
      // (document.querySelector('#progressSpinner') as HTMLElement).style.display = 'none';
      dialogRef.close();
      // this.toggleSpinner()
      // window.location.href=this.serverUrl;
    });
  }

  deleteAction() {
    console.log('deletin\'')
    let dialogRef = this.dialog.open(DialogComponent);
    var url = this.serverUrl + 'deleteDat';
    this.http.get(url, {observe: 'response'}).subscribe(data => {
      console.log('url: ' + url + ' data: ' + JSON.stringify(data));
      this.responseData = JSON.stringify(data);
      dialogRef.close();
      this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl);
      // (document.querySelector('#iframe_a') as HTMLElement).location.href.reload()
      // var myFrame=document.querySelector('#iframe_a');
      // myFrame.contentWindow.location.reload(true);
      // let doc =  this.iframe.nativeElement.contentDocument || this.iframe.nativeElement.contentWindow;
      var iframe = document.getElementById('iframe');
      var iWindow = (<HTMLIFrameElement> iframe).contentWindow;
      (<HTMLIFrameElement> iframe).src = "<p>Hey, download a dat already!";
      console.log("dude");
      // doc.close();
    });
  }

  refreshIframe() {
    this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl);
  }
}
