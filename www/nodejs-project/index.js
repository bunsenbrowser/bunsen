const path = require('path');
const mkdirp = require('mkdirp')
var DatGateway = require('dat-gateway')
// var ram = require('random-access-memory')
// var Dat = require('dat-node')
// const fs = require('fs');
const {DatSessionDataExtMsg} = require('@beaker/dat-session-data-ext-msg')
const express = require('express');
const expressWebSocket = require('express-ws');
const websocketStream = require('websocket-stream/stream');
const app = express();
// extend express app with app.ws()
expressWebSocket(app, null, {
    // ws options here
    perMessageDeflate: false,
});

console.log("cwd: " + process.cwd())
console.log("__dirname: " + __dirname)

const datGatewayName = 'dat-gateway';
const max = 20;
const period = 60 * 1000 // every minute
const port = 3000
const ttl = 43200 * 60 * 1000 // 30 days
const dat = {temp:false}
const redirect = true

var datSessionDataExtMsg = new DatSessionDataExtMsg()

let peerList = [];

var dir = path.join(__dirname, datGatewayName)
console.log("redirect: " + redirect)
mkdirp.sync(dir) // make sure it exists
const gateway = new DatGateway({ dir, dat, max, period, ttl, redirect })
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
