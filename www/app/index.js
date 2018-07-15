const serverUrl = 'http://localhost:3000/';
// serverUrl = 'http://gateway.mauve.moe:3000/';
const port = 3000;
// bunsenAddress = "bunsen.hashbase.io/"
const bunsenAddress = "fork-ui2-bunsen.hashbase.io/"
let datUrl;
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

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded test')

    document.querySelector('#iframe').style.display = "none";
    document.querySelector('mat-progress-bar').style.display = "block";
    document.querySelector('#iframe').addEventListener('load', this.onLoadIframe.bind(this));

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

    // document.querySelector('mat-progress-bar').style.display = "none";

    var ping_loop = setInterval(() => {

        ping("localhost", port, function(msg){
            // console.log("It took "+m+" miliseconds.");
            pingstatus = msg;
            console.log("pingstatus: " + pingstatus)
        })
        // let dialogRef = this.dialog.open(DialogComponent);

        if (pingstatus == "connected") { // all requests are passed and have returned
            datUrl = serverUrl + bunsenAddress;
            // var iframe = document.querySelector('#iframe') as HTMLElement
            // (document.querySelector('#iframe') as HTMLElement).style.display = "block";
            // this.checkDatSite()
            this.loadBunsen(this.bunsenAddress);
            clearInterval(ping_loop);
        }
    }, TIME_PERIOD)


})

document.addEventListener('resume', () => {
    console.log('resume');
}, false);


async function loadBunsen(datUri) {
    console.log('Loading ' + datUri);
    let progressMessage = document.querySelector('#progressMessage');
    // progressMessage.innerHTML = "Downloading...";
    // document.querySelector('mat-progress-bar').style.display = "block";
    this.datUri = datUri;
    console.log('dat datUri: ' + this.datUri);
    const body = {uri: this.datUri};
    var url = this.serverUrl + this.datUri;
    this.fetchedHtml = "";
    let iframe = document.querySelector('#iframe')
    iframe.style.display = "none";
    // this.datUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.serverUrl + this.bunsenAddress);
    datUrl = serverUrl + bunsenAddress;
    iframe.src=datUrl;
    // (document.querySelector('#urlBar') as HTMLElement).style.display = "none";
    progressMessage.innerHTML = "";
    const addArchive = this.addArchive
    const selectArchive = this.selectArchive
    const storage = idb('dat://storage')
    const server = new RPC.Server(window, iframe.contentWindow, {
        storage,
        addArchive,
        selectArchive
    });
    window['gatewayServer'] = server;
    window['gatewayStorage'] = storage;
}

function onLoadIframe() {
    console.log("iframe onload");
    let iframe = document.querySelector('#iframe')
    if (iframe.src == 'http://localhost:3000/') {
        // if (iframe.src == 'http://gateway.mauve.moe:3000/') {
        iframe.style.display = "none";
    } else {
        iframe.style.display = "block";
        document.querySelector('#loading').style.display = "none";
        // (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "none";
    }

}