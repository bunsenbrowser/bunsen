///<reference path="../typings.d.ts"/>
///<reference path="../../node_modules/@types/node/index.d.ts"/>
import {Component, ElementRef, Input, NgZone, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {AppService} from "./app.service";
import * as websocket from 'websocket-stream';
import * as RPC from "./server.component";
// import * as idb from 'random-access-idb'
var idb = require('random-access-idb');

(window as any).handleOpenURL = (url: string) => {
  (window as any).handleOpenURL_LastURL = url;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  providers: [ AppService ],
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  url: '';
  title = 'Bunsen';
  datUri = '';
  results: string[];
  serverUrl = 'http://localhost:3000/';
  // serverUrl = 'http://gateway.mauve.moe:3000/';
  port = 3000;
  // bunsenAddress = "bunsen.hashbase.io/"
  bunsenAddress = "fork-ui2-bunsen.hashbase.io/"
  responseData = '';
  datUrl: SafeResourceUrl;
  // hashbaseUrl: "http://localhost:8080";
  fetchedHtml = '';
  error: any;
  headers: string[];
  datResponse:any;

  // Inject HttpClient into your component or service.
  constructor(private http: HttpClient, private sanitizer: DomSanitizer, private ngZone: NgZone, private appService: AppService) {
    this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl);

    // kudos: https://github.com/EddyVerbruggen/Custom-URL-scheme/issues/227#issuecomment-318810896
    // override open handler to navigate on further custom url scheme actions
    (window as any).handleOpenURL = (url: string) => {
      // this context is called outside of angular zone!
      setTimeout(() => {
        // so we need to get back into the zone..
        this.ngZone.run(() => {
          // this is in the zone again..
          this.handleOpenUrl(url);
        });
      }, 0);
    };

    // check if app was opened by custom url scheme
    const lastUrl: string = (window as any).handleOpenURL_LastURL || "";
    if (lastUrl && lastUrl !== "") {
      delete (window as any).handleOpenURL_LastURL;
      this.handleOpenUrl(lastUrl);
    }
  }

  @Input('mdMenuTriggerFor')
  @Input() size: number = 50;
  @Input() show: boolean;
  // @ViewChild('iframe') iframe: ElementRef;
  @ViewChild('iframe') iframe: any;

  private handleOpenUrl(datUri) {
    console.log("received url: " + datUri);
    (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "block";
    // var url = datUri.replace('dat://', '') + "/"
    let progressMessage = document.querySelector('#progressMessage');
    progressMessage.innerHTML = "Downloading...";
     this.update(datUri);
     // this.refreshIframe();
  }

  ngOnInit() {
    document.addEventListener('deviceready', () => {
      console.log('deviceready');
      startNodeProject();

      function channelListener(msg) {
        console.log('[cordova] received: ' + msg);
      };

      function startupCallback(err) {
        if (err) {
          console.log(err);
        } else {
          console.log ('Node.js Mobile Engine Started');
          nodejs.channel.send('Hello from Cordova!');
        }
      };

      function startNodeProject() {
        console.log ('Starting nodejs listener');
        nodejs.channel.setListener(channelListener);
        console.log ('Starting dat-gateway');
        nodejs.start('index.js', startupCallback);
        // To disable the stdout/stderr redirection to the Android logcat:
        // nodejs.start('index.js', startupCallback, { redirectOutputToLogcat: false });
      };


    }, false);

     document.addEventListener('resume', () => {
      console.log('resume');
    }, false);
    }

  ngAfterViewInit() {
    console.log("ngAfterViewInit");
    (document.querySelector('#iframe') as HTMLIFrameElement).style.display = "none";

    // (document.querySelector('#iframe') as HTMLElement).style.display = "none";
    (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "block";
    this.iframe.nativeElement.addEventListener('load', this.onLoadIframe.bind(this));

    var TIME_PERIOD = 1000; // 1000 ms between each ping

    var pingstatus = "not connected";

    //kudos: https://stackoverflow.com/a/13975363
    var ping = (host, port, pong) => {
      var started = new Date().getTime();
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open("GET", "http://" + host + ":" + port, /*async*/true);
      xmlhttp.onload = function() {
        var msg = "connected"
        console.log(msg);
        pong(msg);
      }
      xmlhttp.onerror = function() {
        var msg = "not connected"
        console.log(msg);
        pong(msg);
      }
      try {
        xmlhttp.send(null);
      } catch(exception) {
        console.log("Failed: " + exception)
        // this is expected
      }
    }

    (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "none";

    var ping_loop = setInterval(() => {

      ping("localhost", this.port, function(msg){
      // ping("gateway.mauve.moe", this.port, function(msg){
        // console.log("It took "+m+" miliseconds.");
        pingstatus = msg;
        console.log("pingstatus: " + pingstatus)
      })
      // let dialogRef = this.dialog.open(DialogComponent);

      if (pingstatus == "connected") { // all requests are passed and have returned
        this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl + this.bunsenAddress);
        // var iframe = document.querySelector('#iframe') as HTMLElement
        // (document.querySelector('#iframe') as HTMLElement).style.display = "block";
        // this.checkDatSite()
        this.loadBunsen(this.bunsenAddress);
        clearInterval(ping_loop);
      }
      }, TIME_PERIOD)
  }

  async update(datUri: string) {
    let progressMessage = document.querySelector('#progressMessage');
    // progressMessage.innerHTML = "Downloading...";
    (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "block";
    this.datUri = datUri;
    console.log('dat datUri: ' + this.datUri);
    const body = {uri: this.datUri};
    // var url = this.serverUrl + this.datUri;
    this.fetchedHtml = "";
    this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl + this.bunsenAddress + "#" + datUri);
    var iframe = document.querySelector('#iframe') as HTMLIFrameElement
    iframe.src = this.serverUrl + this.bunsenAddress + "#" + datUri
    // (document.querySelector('#urlBar') as HTMLElement).style.display = "none";
    progressMessage.innerHTML = "";
    (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "none";
    (document.querySelector('#loading') as HTMLElement).style.display = "none";
    (document.querySelector('#iframe') as HTMLIFrameElement).style.display = "block";
  }

  addArchive(key, secretKey, options, callback) {
    const archiveList = this.getArchives()
    try {
      archiveList.push({
        key,
        secretKey,
        details: options
      })
    } catch (e) {
      console.log('error: ' + e)
    }
    console.log('setting Archives for key: ' + key)
    this.setArchives(archiveList)
    callback()
  }

  selectArchive(options, callback) {
    console.log("Why was selectArchive called?")

  }

  setArchives(newList) {
    try {
      window.localStorage.archives = JSON.stringify(newList)
    } catch (e) {
      console.log('Error: ' + e)
    }
  }

  getArchives() {
    return JSON.parse(window.localStorage.archives || '[]')
  }

  async loadBunsen(datUri: string) {
    console.log('Loading ' + this.datUri);
    let progressMessage = document.querySelector('#progressMessage');
    // progressMessage.innerHTML = "Downloading...";
    (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "block";
    this.datUri = datUri;
    console.log('dat datUri: ' + this.datUri);
    const body = {uri: this.datUri};
    var url = this.serverUrl + this.datUri;
    this.fetchedHtml = "";
    let iframe = document.querySelector('#iframe') as HTMLIFrameElement
    iframe.style.display = "none";
    // (document.querySelector('#iframe') as HTMLIFrameElement).src=url;
    this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl + this.bunsenAddress);
    // (document.querySelector('#urlBar') as HTMLElement).style.display = "none";
    progressMessage.innerHTML = "";
    const addArchive = this.addArchive
    const selectArchive = this.selectArchive
    const storage = idb('dat://storage')
    // const server = new RPC.ServerComponent(window, iframe.contentWindow, {
    const server = new RPC.ServerComponent(window, this.iframe.nativeElement.contentWindow, {
      storage,
      addArchive,
      selectArchive
    })

  }


  async refreshIframe() {
    let progressMessage = document.querySelector('#progressMessage');
    progressMessage.innerHTML = "";
    this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl);
  }

  onLoadIframe() {
    console.log("iframe onload");
    let iframe = document.querySelector('#iframe') as HTMLIFrameElement
    // if (iframe.src == 'http://localhost:3000/') {
    // if (iframe.src == 'http://gateway.mauve.moe:3000/') {
    //   iframe.style.display = "none";
    // } else {
      iframe.style.display = "block";
      (document.querySelector('#loading') as HTMLElement).style.display = "none";
      (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "none";


    // }

  }

}
