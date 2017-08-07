var http = require('http')
var net = require('net')
console.log("loading ram")
var ram = require('random-access-memory')
console.log("loading hyperdrive")
var hyperdrive = require('hyperdrive')
console.log("loading hyperdiscovery")
var discovery = require('hyperdiscovery')
// console.log("loading dat-js")
// var Dat = require('dat-js')
console.log("loading hyperdrive-http dependencies")
var lru = require('lru')
var hyperdrive = require('hyperdrive')
var swarm = require('discovery-swarm')
var defaults = require('datland-swarm-defaults')
var minimist = require('minimist')
var ram = require('random-access-memory')
var hyperdriveHttp = require('hyperdrive-http')

// var android = function () { // TODO: move to internal module
//     var port = Number(process.argv[process.argv.length - 1])
//     var sock = net.connect(port, '127.0.0.1')
//     return {
//         loadUrl: function (u) {
//             sock.write(u)
//         }
//     }
// }()

console.log("hello new world again")
console.log("looks pretty sesame here.")
console.log('argv', process.argv)


// var link = "dat://778f8d955175c92e4ced5e4f5563f69bfec0c86cc6f670352c457943666fe639"
var link = "778f8d955175c92e4ced5e4f5563f69bfec0c86cc6f670352c457943666fe639"
// var archiveText = "";
// var archive = hyperdrive(ram, link)
// archive.ready(function (err) {
//   if (err) throw err
//   console.log('key', archive.key.toString('hex'))
//   var sw = discovery(archive)
//   // sw.on('connection', function (peer, type) {
//   //   // console.log('got', peer, type) // type is 'webrtc-swarm' or 'discovery-swarm'
//   //   // console.log('connected to', sw.connections, 'peers')
//   //   peer.on('close', function () {
//   //     console.log('peer disconnected')
//   //   })
//   // })
//   console.log("Trying to clone via dat.")
//   // clone.add(key, function (repo) {
//   //   archive.readFile('dat.json', function (err, data) {
//   //     console.log("dat.json: " + data.toString()) // prints 'world'
//   //   })
//   // })
//   var stream = archive.readFile('dat.json', 'utf-8', function (err, data) {
//     if (err) throw err
//     archiveText = data;
//     console.log(data)
//   })
// })

// var server = http.createServer(function (req, res) {
//     res.setHeader('Content-Type', 'text/html')
//     res.end(`
//         <html>
//             <body>
//                 <h1>Hello</h1>
//                 <h1>From></h1>
//                 <h1>Node</h1>
//             </body>
//         </html>
//     `)
// })

// server.listen(0, function () {
//     // android.loadUrl('http://localhost:' + server.address().port)
// })

// server.listen(8080);
// console.log("Server is listening");

// var argv = minimist(process.argv.slice(2), {
//   alias: {port: 'p', cacheSize: 'cache-size'},
//   default: {port: process.env.PORT || 8080, db: 'dat.haus.db'}
// })
//
// var db = ram
// var drive = hyperdrive(db)
//
// var sw = swarm(defaults({
//   hash: false,
//   stream: function (info) {
//     var stream = drive.replicate()
//     if (info.channel) join(info.channel) // we already know the channel, join
//     else stream.once('open', join) // wait for the remote to tell us
//     return stream
//
//     function join (discoveryKey) {
//       var archive = cache.get(discoveryKey.toString('hex'))
//       if (archive) archive.replicate({stream: stream})
//     }
//   }
// }))
//
// sw.listen(3282)
// sw.once('error', function () {
//   sw.listen(0)
// })
//
// var cache = lru(argv.cacheSize || 100)
// var file = argv.persist === false ? ram : undefined
//
// cache.on('evict', function (item) {
//   sw.leave(Buffer(item.key, 'hex'))
//   item.value.close()
// })
//
// var server = http.createServer()
//
// var onrequest = hyperdriveHttp(getArchive)
// server.on('request', onrequest)
//
// server.listen(argv.port, function () {
//   console.log('Server is listening on port ' + argv.port)
// })
//
// function getArchive(dat, cb) {
//   console.log("Getting dat: " + dat);
//   var archive = cache.get(dat.discoveryKey)
//   if (!archive) {
//     archive = drive.createArchive(dat.key, {file: file})
//     cache.set(archive.discoveryKey.toString('hex'), archive)
//     sw.join(archive.discoveryKey)
//   }
//   cb(null, archive)
// }

var key = link;
var storage = ram
var port = 8080

var archive = hyperdrive(storage, key, {sparse: true})
var server = http.createServer(hyperdriveHttp(archive, {live: true}))
server.listen(port)
console.log(`Visit http://localhost:${port} to see archive`)

if (key) {
  archive.ready(function () {
    discovery(archive, {live: true})
  })
}
