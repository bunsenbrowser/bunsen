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
var fs = require('fs');
var path = require('path')
var Dat = require('dat-node')
var mirror = require('mirror-folder')

console.log("hello new world again")
console.log('argv', process.argv)

var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

// var link = "dat://778f8d955175c92e4ced5e4f5563f69bfec0c86cc6f670352c457943666fe639"
// var link = "778f8d955175c92e4ced5e4f5563f69bfec0c86cc6f670352c457943666fe639"

var opts = {}
var app = express()
app.set('port', process.env.PORT || 8080);
var dat = ""
console.log("cwd: " + process.cwd())
console.log("__dirname: " + __dirname)
// var dir = "www"
var dest = path.join(__dirname, 'www')
var index = path.join(__dirname, 'www/index.html')

// var dest = path.join('/data/data/org.rti.sses.rcd.bunsen/cache/node/', 'www')
if (!fs.existsSync(dest)){
  fs.mkdirSync(dest)
}

fs.readdir(dest, function(err, files) {
  if (!files.length) {
      // directory appears to be empty
    if (!fs.existsSync(index)){
      console.log("Np Bunsen app here.")
      app.get('/', function( req, res) {
        res.send('This is an empty Bunsen application. Enter a dat and go man go!');
      });
    }
    }
});


app.use(express.static(dest))
app.get('/dat/:dat', function(req, res) {
  // var name = decodeURI(req.url.split('/')[0])
  var name = '/';
  var dat = req.params.dat
  console.log("name: " + name + " dat: " + dat)
  // res.send("dat is set to " + req.params.dat);
  // var link = "778f8d955175c92e4ced5e4f5563f69bfec0c86cc6f670352c457943666fe639"

  // 1. Tell Dat where to download the files
  Dat(ram, {key: dat, sparse: true}, function (err, dat) {
    if (err) throw err

    var network = dat.joinNetwork()
    network.once('connection', function () {
      console.log('Connected')
    })
    dat.archive.metadata.update(download)

    function download () {
      var progress = mirror({fs: dat.archive, name: '/'}, dest, function (err) {
        if (err) throw err
        console.log('Done')
      })
      progress.on('put', function (src) {
        console.log('Downloading', src.name)
      })
      progress.on('end', function () {
        console.log('Finished downloading')
        ondirectory(dat.archive, name, req, res, opts)
      })
    }

    console.log(`Downloading: ${dat.key.toString('hex')}\n`)
  })
});

app.get('/deleteDat', function(req, res) {
  console.log("Deleting www dir containing the dat.")
  deleteFolderRecursive(dest)
  if (!fs.existsSync(dest)){
    console.log("Need to create the www directory.")
    fs.mkdirSync(dest)
    res.send('Dat deleted.');
  }

  // server.close(
  //   function() {
  //     app.listen(8080, function() {
  //       console.log("Server is back up.")
  //       res.send('Dat deleted.');
  //     });
  //   }
  // )
})

var server = app.listen(8080);

// kudos: https://github.com/joehand/hyperdrive-http/blob/master/index.js
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
    onfile(archive, name + 'index.html', req, res)
      // ondirectoryindex(archive, name, req, res, opts)
  })
}

function ondirectoryindex (archive, name, req, res, opts) {
  console.log("ondirectoryindex")
  list(archive, name, function (err, entries) {
    if (err) entries = []
    // console.log("ondirectoryindex entries: " + entries + " error: " + err)
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
    // console.log("names: " + names + " err: " + err)
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


