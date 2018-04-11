///<reference path="../typings.d.ts"/>
import {Component, ElementRef, Input, NgZone, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {AppService} from "./app.service";
import {Observable} from "rxjs/Observable";
// import {ImageService} from "./image.service";

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
  serverUrl = 'http://localhost:8080/';
  serverDatUrl = this.serverUrl + 'dat/';
  responseData = '';
  datUrl: SafeResourceUrl;
  hashbaseUrl: "http://localhost:8080";
  fetchedHtml = '';
  error: any;
  headers: string[];
  datResponse:any;
  datLinks =     '<div id="links">' +
  '<a href="dat://pfrazee.hashbase.io">dat://pfrazee.hashbase.io</a><br/>' +
  '<a href="dat://Don-Marti-dmarti.hashbase.io">dat://Don-Marti-dmarti.hashbase.io</a><br/>' +
  '<a href="dat://protozoa-mixmix.hashbase.io">dat://protozoa-mixmix.hashbase.io</a><br/>' +
  '<a href="dat://conquest-creationix.hashbase.io">dat://conquest-creationix.hashbase.io</a><br/>' +
  '<a href="dat://sasha-taravancil.hashbase.io">dat://sasha-taravancil.hashbase.io</a>' +
  '</div>'
  noDat = '<div style="text-align: center; margin-top: 50px;">' +
    '<p>This is an empty Bunsen application. ' +
    'Enter a dat hash (without dat://) in the box above or switch to your browser and click a link to a dat url. ' +
    '<br/><br/>' +
    'There is a dat hash preloaded in the input box: click the -> to load it.' +
    '<br/><br/>' +
    'Tip: Open hashbase.io in your mobile browser and click one of the dat sites in their listing. ' +
    'This should download the site into Bunsen.' +
    '<br/><br/>' +
    'Bunsen currently holds only one dat at a time. Use the trash icon or load a new dat to delete the current dat.' +
    '<br/><br/>' +
    'Sharing is caring: When you load a dat into Bunsen, it automatically shares the dat on the network.</p>' +
    '</div></body></html>';

  hasDatLoaded: any

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


  private handleOpenUrl(url) {
    console.log("received url: " + url);
    (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "block";
    var datUri = url.replace('dat://', '')
    let progressMessage = document.querySelector('#progressMessage');
    progressMessage.innerHTML = "Downloading...";
     this.update(datUri);
     this.refreshIframe();
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
        console.log ('Starting Angular 2 app');
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

    (document.querySelector('#iframe') as HTMLElement).style.display = "none";
    (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "none";
    // this.iframe.nativeElement.addEventListener('load', this.onLoadIframe.bind(this));

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

      ping("localhost", "8080", function(msg){
        // console.log("It took "+m+" miliseconds.");
        pingstatus = msg;
        console.log("pingstatus: " + pingstatus)
      })
      // let dialogRef = this.dialog.open(DialogComponent);

      if (pingstatus == "connected") { // all requests are passed and have returned
        this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl("http://localhost:8080");
        // var iframe = document.querySelector('#iframe') as HTMLElement
        (document.querySelector('#iframe') as HTMLElement).style.display = "block";
        this.checkDatSite()
        clearInterval(ping_loop);
      } else {
        // this.fetchedHtml = this.noDat;
        // (document.querySelector('#box') as HTMLElement).style.display = "block";
      }
      }, TIME_PERIOD)
  }

  checkDatSite() {
    var url = this.serverUrl + "index.html"
    this.appService.getDatResponse(url)
      .subscribe(resp => {
          // display its headers
          const keys = resp.headers.keys();
          this.headers = keys.map(key =>
            `${key}: ${resp.headers.get(key)}`);

          // access the body directly
          this.datResponse = { ... resp.body };
          console.log("headers: " + JSON.stringify(this.headers));
          // console.log("datResponse: " + JSON.stringify(this.datResponse));
          let progressMessage = document.querySelector('#progressMessage');
          progressMessage.innerHTML = ""
        },
        error => {
          this.error = error // error path
          console.log("err:" + error)
          this.fetchedHtml = this.noDat;
          let progressMessage = document.querySelector('#progressMessage');
          progressMessage.innerHTML = ""
        }
      )
  }


  async update(datUri: string) {
    // this.toggleSpinner();
    // (document.querySelector('#progressSpinner') as HTMLElement).style.display = "block";
    // let dialogRef = this.dialog.open(DialogComponent);
    let progressMessage = document.querySelector('#progressMessage');
    // progressMessage.innerHTML = "Downloading...";
    (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "block";
    this.datUri = datUri;
    console.log('dat datUri: ' + this.datUri);
    const body = {uri: this.datUri};
    var url = this.serverDatUrl + this.datUri;
    this.fetchedHtml = "";

    this.appService.getDatResponse(url)
      .subscribe(resp => {
          console.log('url: ' + url);
          this.responseData = JSON.stringify(resp);
          this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl);
          (document.querySelector('#urlBar') as HTMLElement).style.display = "none";
          progressMessage.innerHTML = "";
          (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "none";
        },
        error => {
          this.error = error // error path
          console.log("err:" + error)
          this.fetchedHtml = this.noDat;
          let progressMessage = document.querySelector('#progressMessage');
          progressMessage.innerHTML = ""
        }
      )
  }

  deleteAction() {
    console.log('deletin\'')
    // let dialogRef = this.dialog.open(DialogComponent);
    var url = this.serverUrl + 'deleteDat';

    this.appService.getDatResponse(url)
      .subscribe(resp => {
          console.log('url: ' + url + ' data: ' + JSON.stringify(resp));
          this.responseData = JSON.stringify(resp);
          this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl);
          this.fetchedHtml =  this.noDat;
          (document.querySelector('#urlBar') as HTMLElement).style.display = "block";
        },
        error => {
          this.error = error // error path
          console.log("err:" + error)
          this.fetchedHtml = this.noDat;
          let progressMessage = document.querySelector('#progressMessage');
          progressMessage.innerHTML = ""
        }
      );
  }

  async refreshIframe() {
    let progressMessage = document.querySelector('#progressMessage');
    progressMessage.innerHTML = "";
    this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl);
  }

  // onLoadIframe() {
  //   console.log("iframe onload");
  //   // var iWindow = (<HTMLIFrameElement>this.iframe).contentWindow;
  //   // var iWindow = this.iframe.contentWindow;
  //   // var doc = iWindow.document;
  //   // console.debug(doc);
  //   // console.log(doc.getElementById('foo').innerText);
  //   // (document.querySelector('#box') as HTMLElement).style.display = "none";
  // }

}
