var http = require('http')
var net = require('net')
console.log("loading ram")
var ram = require('random-access-memory')
console.log("loading hyperdrive")
var hyperdrive = require('hyperdrive')
console.log("loading hyperdiscovery")
var discovery = require('hyperdiscovery')

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
console.log("looks pretty here.")
console.log('argv', process.argv)


// var link = "dat://778f8d955175c92e4ced5e4f5563f69bfec0c86cc6f670352c457943666fe639"
var link = "778f8d955175c92e4ced5e4f5563f69bfec0c86cc6f670352c457943666fe639"

var archive = hyperdrive(ram, link)
archive.ready(function (err) {
  if (err) throw err
  console.log('key', archive.key.toString('hex'))
  var sw = discovery(archive)
  sw.on('connection', function (peer, type) {
    console.log('got', peer, type) // type is 'webrtc-swarm' or 'discovery-swarm'
    console.log('connected to', sw.connections, 'peers')
    peer.on('close', function () {
      console.log('peer disconnected')
    })
  })
})

var server = http.createServer(function (req, res) {
    res.setHeader('Content-Type', 'text/html')
    res.end(`
        <html>
            <body>
                <h1>Hello</h1>
                <h1>From></h1>
                <h1>Node</h1>
            </body>
        </html>
    `)
})

// server.listen(0, function () {
//     // android.loadUrl('http://localhost:' + server.address().port)
// })

server.listen(8080);
console.log("Server is listening");
