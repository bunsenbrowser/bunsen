const serverUrl = 'http://localhost:3000/';
// serverUrl = 'http://gateway.mauve.moe:3000/';
const port = 3000;
// bunsenAddress = "bunsen.hashbase.io/"
const bunsenAddress = "fork-ui2-bunsen.hashbase.io/"
let datUrl;
const selectQueue = []


// Cordova init code
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

    document.querySelector('#client-frame').style.display = "none";
    document.querySelector('#client-frame').addEventListener('load', this.onLoadIframe.bind(this));

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

    var ping_loop = setInterval(() => {

        ping("localhost", port, function(msg){
            // console.log("It took "+m+" miliseconds.");
            pingstatus = msg;
            console.log("pingstatus: " + pingstatus)
        })
        // let dialogRef = this.dialog.open(DialogComponent);

        if (pingstatus == "connected") { // all requests are passed and have returned
            datUrl = serverUrl + bunsenAddress;
            this.loadBunsen();
            clearInterval(ping_loop);
        }
    }, TIME_PERIOD)


})

document.addEventListener('resume', () => {
    console.log('resume');
}, false);

function addArchive (key, secretKey, options, callback) {
    const archiveList = getArchives()
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
    setArchives(archiveList)
    callback()
}

function selectArchive (options, callback) {
    selectQueue.push({
        options: options,
        callback: callback
    })

    // showNext()
}

function setArchives (newList) {
    try {
        window.localStorage.archives = JSON.stringify(newList)
    } catch (e) {
        console.log('Error: ' + e)
    }
}

function getArchives () {
    return JSON.parse(window.localStorage.archives || '[]')
}


async function loadBunsen(datUri) {
    console.log('Loading ' + datUri);
    let progressMessage = document.querySelector('#progressMessage');
    this.datUri = datUri;
    console.log('dat datUri: ' + this.datUri);
    const body = {uri: this.datUri};
    var url = this.serverUrl + this.datUri;
    this.fetchedHtml = "";
    let iframe = document.querySelector('#client-frame')
    iframe.style.display = "none";
    // datUrl = serverUrl + bunsenAddress;
    datUrl = './client/index.html?DAT_GATEWAY=http%3A//localhost%3A3000';
    iframe.src = datUrl;
    progressMessage.innerHTML = "";
    const storage = idb('dat://storage')
    const server = new RPC.Server(window, iframe.contentWindow, {
        storage,
        addArchive,
        selectArchive
    });
    window.gatewayServer = server
    window.gatewayStorage = storage

}

function onLoadIframe() {
    console.log("iframe onload");
    let iframe = document.querySelector('#client-frame')
    if (iframe.src == 'http://localhost:3000/') {
        iframe.style.display = "none";
    } else {
        iframe.style.display = "block";
        document.querySelector('#loading').style.display = "none";
    }

}