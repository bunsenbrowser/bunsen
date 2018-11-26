const path = require('path');
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const mkdirp = require('mkdirp')
var DatGateway = require('dat-gateway')
var DatArchive = require('node-dat-archive')
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const access = util.promisify(fs.access);
const {DatSessionDataExtMsg} = require('@beaker/dat-session-data-ext-msg')
const express = require('express');
const expressWebSocket = require('express-ws');
const websocketStream = require('websocket-stream/stream');
var storage = require('dat-storage')

const app = express();
// extend express app with app.ws()
expressWebSocket(app, null, {
    // ws options here
    perMessageDeflate: false,
});
var cors = require('cors')
var bodyParser = require('body-parser');
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/test', express.static(path.join(__dirname, 'test')));


console.log("cwd: " + process.cwd())
console.log("__dirname: " + __dirname)


const max = 20;
const period = 60 * 1000 // every minute
const port = 3000
const ttl = 43200 * 60 * 1000 // 30 days
const dat = {temp:false}
const redirect = true
const datGatewayName = 'dat-gateway';
const secretKeysName = 'secret_keys';
var datGatewayRoot = path.join(__dirname, datGatewayName)
var secretKeysRoot = path.join(__dirname, secretKeysName)

var datSessionDataExtMsg = new DatSessionDataExtMsg()

// websockets events
let peerList = [];
let watchEvents = [];
let events;

console.log("datGatewayRoot: " + datGatewayRoot)

// make sure these dirs exists
mkdirp.sync(datGatewayRoot)
mkdirp.sync(secretKeysRoot)

const gateway = new DatGateway({ dir:datGatewayRoot, dat, max, period, ttl, redirect })
gateway
    .load()
    .then(() => {
        return gateway.listen(port)
    })
    .then(function () {
        console.log('[dat-gateway] Now listening on port ' + port)
        datSessionDataExtMsg.on('session-data', onSessionDataMsg)
    })
    .catch(console.error)

gateway.on('error', (error) => {
    console.log("error in gateway: " + error)
})

app.ws('/peerList', function(ws, req) {
    // convert ws instance to stream
    const stream = websocketStream(ws, {
        // websocket-stream options here
        binary: false,
    });

    gateway.on('join', (dat) => {
        let connections = dat.network.connections.length
        let key = dat.options.key
        console.log(key + " has " + connections + " peers.")
        if (typeof dat.archive !== 'undefined') {
            peerList = dat.archive.metadata.peers.map(internalPeerObj => createWebAPIPeerObj(dat.archive, internalPeerObj))
            console.log("peerList" + JSON.stringify(peerList))
            try {
                if (peerList.length > 0) {
                    stream.write("peerList:" + JSON.stringify(peerList))
                }
                // ws.send("peerList:" + JSON.stringify(peerList))
                // fs.createReadStream(JSON.stringify(peerList)).pipe(stream);
                // peerList.pipe(stream);
            } catch(err) {
                console.log("err:" + err)
            }
        }
    })

    ws.on('error', (err) => console.log('error: ' + err));

    // fs.createReadStream(peerList).pipe(stream);
    // ws.on('message', function(msg) {
    //     console.log(msg);
    // });
    // console.log('socket', req.testing);
});

app.post('/create', async function (request, response) {
    console.log("Creating a datArchive")
    var title = request.body.title;
    var description = request.body.description;
    var type = request.body.type;
    var author = request.body.author;
    var uuid = uuidv4();
    var localPath = datGatewayRoot + '/' + uuid;
    var store = storage(localPath, {secretDir: secretKeysRoot});
    var datOptions = {latest: true, storage: store}
    var netOptions = null;
    let data = {localPath, datOptions, netOptions, title, description, type, author}
    console.log("create DatArchive at " + JSON.stringify(localPath)  )

    try {
        var archive = await DatArchive.create(data)
    } catch (e) {
        console.log("Error: " + e);
        // console.trace()
        var stack = new Error().stack
        console.log( stack )
        response.status(400).send({ statusText: e.toString() });
    }
    let url = archive.url
    data.url = url
    const newDir = url.replace('dat://','')
    const newPath = datGatewayRoot + '/' + newDir;
    // await sleep(1000)
    fs.rename(localPath, newPath, (err) => {
        if (err)  {
            // throw err;
            var stack = new Error().stack
            console.log( stack )
            // response.status(400).send({ statusText: err.toString() });
        }
        console.log('Rename complete!' + localPath + " to " + newPath);
    });
    data.localPath = newPath
    console.log("data.localPath after re-naming: " + data.localPath + " data object: " + JSON.stringify(data))
    response.send(JSON.stringify(data))
});

// rjsteinert: I'm not sure if doing this has any benefits. It downloads to disk but when doing things like reading files from archives you don't own, that comes from memory.
app.post('/load', async function (request, response) {
    console.log("Loading a datArchive")
    var datUrl = request.body.datUrl;
    let key
    try {
        key = await DatArchive.resolveName(datUrl)
    } catch(e) {
        return response.send({})
    }
    var localPath = datGatewayRoot + '/' + key;
    console.log(localPath)
    try {
        await access(localPath)
    } catch (e) {
        const out = await exec(`cd ${datGatewayRoot} && ../node_modules/.bin/dat clone ${key}`)
    }
    var store = storage(localPath, {secretDir: secretKeysRoot});
    var datOptions = {latest: true, storage: store}
    var netOptions = null;
    let data = {localPath, datOptions, netOptions}
    console.log("create DatArchive at " + JSON.stringify(localPath)  )
    try {
        var archive = await DatArchive.load(data)
    } catch (e) {
        console.log("Error: " + e);
        // console.trace()
        var stack = new Error().stack
        console.log( stack )
        response.status(400).send({ statusText: e.toString() });
    }
    // Clientside DatArchive.load just returns a DatArchive object with URL property.
    response.send(JSON.stringify({ url: archive.url}))
});

app.post('/getInfo', async function (request, response) {
    console.log("getInfo for a DatArchive")
    var url = request.body.url;
    var opts = request.body.opts;
    var datName = url.replace('dat://','')
    console.log("getInfo for  " + url)
    // var info = await DatArchive.getInfo(url)
    var localPath = datGatewayRoot + '/' + datName
    var store = storage(localPath, {secretDir: secretKeysRoot});
    var datOptions = {latest: true, storage: store}
    var netOptions = null;
    let data = {localPath, datOptions, netOptions}
    try {
        var archive = await DatArchive.load(data)
        var info = await archive.getInfo(url)
        console.log("getInfo: " + JSON.stringify(info))
        response.send(JSON.stringify(info))
    } catch (e) {
        console.log("Error: " + e);
        // console.trace()
        var stack = new Error().stack
        console.log( stack )
        response.status(400).send({ statusText: e.toString() });
    }
});

app.post('/readFile', async function (request, response) {
    console.log("read a DatArchive")
    var filename = request.body.filename;
    var url = request.body.url;
    var datName = url.replace('dat://','')
    var localPath = datGatewayRoot + '/' + datName
    var datOptions = {latest: true}
    var netOptions = null;
    let data = {localPath, datOptions, netOptions}
    var archive = await DatArchive.load(data)
    response.send(await archive.readFile(filename))
});

app.post('/mkdir', async function (request, response, next) {
    console.log("getInfo for a DatArchive")
    var filename = request.body.filename;
    var url = request.body.url;
    var datName = url.replace('dat://','')
    var localPath = datGatewayRoot + '/' + datName
    var store = storage(localPath, {secretDir: secretKeysRoot});
    var datOptions = {latest: true, storage: store}
    var netOptions = null;
    let data = {localPath, datOptions, netOptions}
    console.log("mkdir for  " + filename)
    var archive = await DatArchive.load(data)

    var info;
    try {
        info = await archive.mkdir(filename)
        // console.log("data with url: " + JSON.stringify(info) + " filename: " + filename)
        response.send(JSON.stringify(info))
    } catch (e) {
        console.log("Error: " + e)
        // console.log("err.message: " + err.message)
        response.status(400).send({ statusText: e.toString() });
        // res.status(500).json({ error: e.toString() });
        // err.statusCode = 403;
        // next(err);
    }
});

app.post('/stat', async function (request, response) {
    console.log("stat for a DatArchive")
    var filename = request.body.filename;
    var url = request.body.url;
    var opts = request.body.opts;
    var datName = url.replace('dat://','')
    console.log("stat for  " + url + " of filename: " + filename)
    // var info = await DatArchive.getInfo(url)
    var localPath = datGatewayRoot + '/' + datName
    var datOptions = {latest: true}
    var netOptions = null;
    let data = {localPath, datOptions, netOptions}
    var archive = await DatArchive.load(data)
    try {
        var info = await archive.stat(filename)
        console.log("getInfo: " + JSON.stringify(info))
        response.send(JSON.stringify(info))
    } catch (e) {
        console.log("Error: " + e)
        response.status(400).send({ statusText: e.toString() });
    }
});

app.ws('/watch/:datAddress', async function (ws, req) {
    const stream = websocketStream(ws, {
        // websocket-stream options here
        binary: false,
    });
    console.log("watch for a DatArchive")
    // var filename = request.body.filename;
    //var pathSpec = request.body.pathSpec;
    var datName = req.params.datAddress
    let key
    try {
        key = await DatArchive.resolveName(datName)
    } catch(e) {
        return response.send({})
    }
    //console.log("watching " + url + " pathSpec: " + pathSpec)
    // var info = await DatArchive.getInfo(url)
    var localPath = datGatewayRoot + '/' + datName
    try {
        await access(localPath)
    } catch (e) {
        const out = await exec(`cd ${datGatewayRoot} && ../node_modules/.bin/dat clone ${key}`)
    }
    var datOptions = {latest: true, live: true}
    var netOptions = null;
    let data = {localPath, datOptions, netOptions}
    var archive = await DatArchive.load(data)
    console.log("archive.url from watch: " + archive.url)
    try {
        events = archive.watch()
        events.addEventListener('invalidated', ({path}) => {
            try {
                ws.send(JSON.stringify({
                    type: 'invalidated',
                    path
                }))
            } catch (e) {
                // Do nothing. A client probably left.
                // @TODO Need to cleanup?
            }
        })
        events.addEventListener('changed', ({path}) => {
            try {
                ws.send(JSON.stringify({
                    type: 'changed',
                    path
                }))
            } catch (e) {
                // Do nothing. A client probably left.
                // @TODO Need to cleanup?
            }

        })
    } catch (e) {
        console.log("Error: " + e)
        response.status(400).send({ statusText: e.toString() });
    }
});


app.post('/writeFile', async function (request, response) {
    console.log("write a DatArchive")
    var filename = request.body.filename;
    var text = request.body.text;
    var url = request.body.url;
    var datName = url.replace('dat://','')
    var localPath = datGatewayRoot + '/' + datName
    var store = storage(localPath, {secretDir: secretKeysRoot});
    var datOptions = {latest: true, storage: store}
    var netOptions = null;
    let data = {localPath, datOptions, netOptions}
    var archive = await DatArchive.load(data)
    console.log("writeFile for  " + filename)
    // debugger;
    archive._archive.on('update', onUpdate)
    archive._archive.on('changed', onUpdate)
    function onUpdate () {
        console.log("emitting events onUpdate writeFile")
    }
    var info = await archive.writeFile(filename, text, 'utf8')
    // console.log("Results of writeFile : " + JSON.stringify(info))
    response.send(JSON.stringify(info))
});

// app.use(function(err, req, res, next) {
//     console.error(err.message); // Log error message in our server's console
//     if (!err.statusCode) err.statusCode = 500; // If err has no specified error code, set error code to 'Internal Server Error (500)'
//     res.status(err.statusCode).send(err.message); // All HTTP requests must have a response, so let's send back an error with its status code and message
// });

app.listen(3001);

function getSessionData (archive) {
    return decodeSessionData(datSessionDataExtMsg.getLocalSessionData(archive))
}
exports.getSessionData = getSessionData

function onSessionDataMsg (archive, internalPeerObj, sessionData) {
    archive._datPeersEvents.emit('session-data', {
        peerId: getPeerId(internalPeerObj),
        sessionData: decodeSessionData(sessionData)
    })
}

function getPeerId (internalPeerObj) {
    var feedStream = internalPeerObj.stream
    var protocolStream = feedStream.stream
    return protocolStream.remoteId ? protocolStream.remoteId.toString('hex') : null
}

function getPeerSessionData (archive, peerId) {
    return decodeSessionData(datSessionDataExtMsg.getSessionData(archive, peerId))
}

function createWebAPIPeerObj (archive, internalPeerObj) {
    var id = getPeerId(internalPeerObj)
    var sessionData = getPeerSessionData(archive, id)
    return {id, sessionData}
}

function decodeSessionData (sessionData) {
    if (!sessionData || sessionData.length === 0) return null
    try {
        return JSON.parse(sessionData.toString('utf8'))
    } catch (e) {
        console.error('Failed to parse local session data', e, sessionData)
        return null
    }
}

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

// Dat(ram, function (err, dat) {
//     if (err) throw err
//
//     var network = dat.joinNetwork()
//     network.once('connection', function () {
//         console.log('Connected')
//     })
//     dat.network.on('connection', function () {
//         console.log('connected to', network.connections.length, 'peers')
//     })
//
//     var archive = dat.archive;
//
// })
