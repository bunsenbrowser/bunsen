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
// var hyperdriveHttp = require('hyperdrive-http')
var toHTML = require('directory-index-html')
var pump = require('pump')
var mime = require('mime')
const express = require('express')


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
// var link = "778f8d955175c92e4ced5e4f5563f69bfec0c86cc6f670352c457943666fe639"
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
//
// var argv = minimist(process.argv.slice(2), {
//   alias: {port: 'p', cacheSize: 'cache-size'},
//   default: {port: process.env.PORT || 8080, db: 'dat.haus.db'}
// })
// //
// var db = ram
// var drive = hyperdrive(db)
//
// var sw = swarm(defaults({
//   hash: false,
//   stream: function (info) {
//     console.log("In the stream")
//     var stream = drive.replicate()
//     if (info.channel) join(info.channel) // we already know the channel, join
//     else stream.once('open', join) // wait for the remote to tell us
//     return stream
//
//     function join (discoveryKey) {
//       console.log("In the stream, joining discoveryKey" + discoveryKey)
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
//   console.log("Getting dat: " + dat + " for cb: " + cb);
//   var archive = cache.get(dat.discoveryKey)
//   if (!archive) {
//     console.log("getArchive createArchive")
//     archive = drive.createArchive(dat.key, {file: file})
//     // archive = drive.replicate(dat.key, {file: file})
//   //   archive = hyperdrive(ram, link, {sparse: true})
//     cache.set(archive.discoveryKey.toString('hex'), archive)
//     sw.join(archive.discoveryKey)
//   }
//   cb(null, archive)
//   return archive
// }


// var key = link;
// var storage = ram
// var port = 8080
//
// var archive = hyperdrive(storage, key, {sparse: true})
// var server = http.createServer(hyperdriveHttp(archive, {live: true}))
// server.listen(port)
// console.log(`Visit http://localhost:${port} to see archive`)
//
// if (key) {
//   archive.ready(function () {
//     discovery(archive, {live: true})
//   })
// }

var opts = {}
var app = express()
app.set('port', process.env.PORT || 8080);
app.get('/', function( req, res) {
  res.send('hello world');
});
var dat = ""
app.get('/dat/:dat', function(req, res) {
  // var name = decodeURI(req.url.split('/')[0])
  var name = '/';
  var dat = req.params.dat
  console.log("name: " + name + " dat: " + dat)
  // res.send("dat is set to " + req.params.dat);
  // var link = "778f8d955175c92e4ced5e4f5563f69bfec0c86cc6f670352c457943666fe639"
  var archiveText = "";
  var archive = hyperdrive(ram, dat)
  archive.ready(function (err) {
    if (err) throw err
    console.log('key', archive.key.toString('hex'))
    var sw = discovery(archive)
    sw.on('connection', function (peer, type) {
      // console.log('got', peer, type) // type is 'webrtc-swarm' or 'discovery-swarm'
      // console.log('connected to', sw.connections, 'peers')
      peer.on('close', function () {
        console.log('peer disconnected')
      })
    })
    // console.log("Trying to clone via dat.")
    // clone.add(key, function (repo) {
    //   archive.readFile('dat.json', function (err, data) {
    //     console.log("dat.json: " + data.toString()) // prints 'world'
    //   })
    // })
    var stream = archive.readFile('index.html', 'utf-8', function (err, data) {
      if (err) throw err
      archiveText = data;
      console.log(archiveText)
      // res.send(archiveText);

      var list = archive.readdir('/', function (err, list) {
        console.log("\n\n archive list: " + list + " err: " + err)
        ondirectory(archive, name, req, res, opts)
      });
    })
    // archive.metadata.on('download', (idx, data) => console.log('download', idx, data))


    // var wait = (query.wait && Number(query.wait.toString())) || 0
    // var have = archive.metadata ? archive.metadata.length : -1
    //
    // if (wait <= have) return ready()
    // waitFor(archive, wait, ready)

    // if (name[name.length - 1] === '/') ondirectory(archive, name, req, res, opts)
    // else onfile(archive, name, req, res)

  })
});

app.listen(8080);


function onfile (archive, name, req, res) {
  archive.stat(name, function (err, st) {
    if (err) return onerror(res, 404, err)

    if (st.isDirectory()) {
      res.statusCode = 302
      res.setHeader('Location', name + '/')
      return
    }

    var r = req.headers.range && range(st.size, req.headers.range)[0]
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Type', mime.lookup(name))

    if (r) {
      res.statusCode = 206
      res.setHeader('Content-Range', 'bytes ' + r.start + '-' + r.end + '/' + st.size)
      res.setHeader('Content-Length', r.end - r.start + 1)
    } else {
      res.setHeader('Content-Length', st.size)
    }

    if (req.method === 'HEAD') return res.end()
    pump(archive.createReadStream(name, r), res)
  })
}

function ondirectory (archive, name, req, res, opts) {
  console.log("ondirectory")
    archive.stat(name + 'index.html', function (err) {
    if (err) return ondirectoryindex(archive, name, req, res, opts)
    // onfile(archive, name + 'index.html', req, res)
      ondirectoryindex(archive, name, req, res, opts)
  })
}

function ondirectoryindex (archive, name, req, res, opts) {
  console.log("ondirectoryindex")
  list(archive, name, function (err, entries) {
    if (err) entries = []
    console.log("ondirectoryindex entries: " + entries + " error: " + err)
    var wait = archive.metadata ? archive.metadata.length + 1 : 0
    var script = `
      function liveUpdate () {
        var xhr = new XMLHttpRequest()
        xhr.open("GET", "${name}?wait=${wait}", true)
        xhr.onload = function () {
          if (xhr.status !== 200) return onerror()
          document.open()
          document.write(xhr.responseText)
          document.close()
        }
        xhr.onerror = onerror
        xhr.send(null)
        function onerror () {
          setTimeout(liveUpdate, 1000)
        }
      }
      liveUpdate()
    `

    var footer = opts.footer ? opts.footer + ' Archive version: ' + archive.version : null
    var html = toHTML({directory: name, script: (!opts.live || archive._checkout) ? null : script, footer: footer}, entries)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Length', Buffer.byteLength(html))
    if (opts.exposeHeaders) {
      res.setHeader('Hyperdrive-Key', archive.key.toString('hex'))
      res.setHeader('Hyperdrive-Version', archive.version)
      res.setHeader('Hyperdrive-Http-Version', pkg.version)
    }
    res.end(html)
  })
}

function onerror (res, status, err) {
  console.log("error: " + err)
  res.statusCode = status
  res.end(err.stack)
}

function list (archive, name, cb) {
  archive.readdir(name, function (err, names) {
    console.log("names: " + names + " err: " + err)
    if (err) return cb(err)

    var error = null
    var missing = names.length
    var entries = []

    if (!missing) return cb(null, [])
    for (var i = 0; i < names.length; i++) stat(name + names[i], names[i])

    function stat (name, base) {
      archive.stat(name, function (err, st) {
        if (err) error = err

        if (st) {
          entries.push({
            type: st.isDirectory() ? 'directory' : 'file',
            name: base,
            size: st.size,
            mtime: st.mtime
          })
        }

        if (--missing) return
        if (error) return cb(error)
        cb(null, entries.sort(sort))
      })
    }
  })
}

function sort (a, b) {
  return a.name.localeCompare(b.name)
}

