const serverUrl = 'http://localhost:3000/';
// serverUrl = 'http://gateway.mauve.moe:3000/';
const port = 3000;
// bunsenAddress = "bunsen.hashbase.io/"
const bunsenAddress = "fork-ui2-bunsen.hashbase.io/"
let datUrl;
const selectQueue = []
let currentSelection = null
const form = document.getElementById('selection-form')
const selectionItems = document.getElementById('selection-items')
const DEFAULT_SELECT_MESSAGE = 'Select an archive'

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

    showNext()
}

function showNext () {
    if (!currentSelection) {
        showSelection(selectQueue.shift())
    }
}

function showSelection (selectionItem) {
    currentSelection = selectionItem
    const archiveList = getArchives()
    if (archiveList.length !== 0) {
        const renderedItems = archiveList.map((archive) => {
            return `
    <label class="select-item">
      <input type="checkbox" value="${archive.key}">
      ${archive.details.title || archive.key}
    </label><br/>
`
        })
        let toRender = `
    <div class="select-message">
      ${DEFAULT_SELECT_MESSAGE}
    </div>
    ${renderedItems.join('\n')}
`
        if (typeof selectionItem.options !== 'undefined') {
            toRender = `
    <div class="select-message">
      ${selectionItem.options.title || DEFAULT_SELECT_MESSAGE}
    </div>
    ${renderedItems.join('\n')}
`
        }

        selectionItems.innerHTML = toRender
        form.classList.remove('hidden')
    }
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

function handleSelected (e) {
    e.preventDefault()

    if (currentSelection) {
        const input = form.querySelector('input:checked')
        const url = `dat://${input.value}`
        currentSelection.callback(false, url)
        currentSelection = null
    }

    if (selectQueue.length === 0) {
        hideForm()
    } else {
        showNext()
    }
}


function hideForm () {
    form.classList.add('hidden')
}

async function loadBunsen() {
    datUrl = './client/index.html?DAT_GATEWAY=http%3A//localhost%3A3000';
    console.log('Loading Bunsen UI from datUri:' + datUrl);
    let progressMessage = document.querySelector('#progressMessage');
    this.datUri = datUrl;
    // console.log('dat datUri: ' + this.datUri);
    // const body = {uri: this.datUri};
    // var url = this.serverUrl + this.datUri;
    this.fetchedHtml = "";
    let iframe = document.querySelector('#client-frame')
    iframe.style.display = "none";
    // datUrl = serverUrl + bunsenAddress;
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

    form.addEventListener('submit', handleSelected)


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

async function receiveMessage (event) {
// console.log(event.data)
    let data = event.data
    if (typeof data.arguments !== 'undefined' && data.arguments.length > 1) {
        let url = data.arguments[1]
        if (typeof url === 'string' && url.startsWith('OPEN')) {
            console.log('opening: ' + url)
            // let archive = await new DatArchive(url)
        }
    }
}