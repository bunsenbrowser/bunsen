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
var bunsenDir = path.join(__dirname, 'bunsen')
var datIdFile = path.join(__dirname, 'bunsen/datIdFile')
var images = path.join(__dirname, 'images')
var index = path.join(__dirname, 'www/index.html')

// var dest = path.join('/data/data/org.rti.sses.rcd.bunsen/cache/node/', 'www')
if (!fs.existsSync(dest)){
  fs.mkdirSync(dest)
}
if (!fs.existsSync(bunsenDir)){
  console.log("Need to create " + bunsenDir)
  fs.mkdirSync(bunsenDir)
}
app.use(express.static(dest))
app.get('/dat/:dat', function(req, res) {
  // var name = decodeURI(req.url.split('/')[0])
  var name = '/';
  var datId = req.params.dat
  console.log("name: " + name + " dat: " + datId)
  // res.send("dat is set to " + req.params.dat);
  // var link = "778f8d955175c92e4ced5e4f5563f69bfec0c86cc6f670352c457943666fe639"

  // 1. Tell Dat where to download the files
  Dat(ram, {key: datId}, function (err, dat) {
    if (err) throw err

    var network = dat.joinNetwork()
    network.once('connection', function () {
      console.log('Connected')
    })
    dat.network.on('connection', function () {
      console.log('I connected to someone for ' + datId)
      console.log('connected to', network.connections.length, 'peers')
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
        // var datString = JSON.stringify(datString)
        console.log('Finished downloading ' + datId)
        fs.writeFile(datIdFile, datId, function(err) {
          if(err) {
            return console.log("Error writing datIdFile: " + err);
          }

          console.log("The file was saved!");
        });
        ondirectory(dat.archive, name, req, res, opts)
      })
    }

    console.log(`Downloading: ${dat.key.toString('hex')}\n`)
  })
});

fs.readFile(datIdFile, 'utf8', function (err,data) {
  if (err) {
    return console.log("Don't have datIdFile yet: " + err);
  }
  console.log("Data: " + data);
  datId = data;
  Dat(dest, {key: datId}, function (err, dat) {
    if (err) throw err
    var network = dat.joinNetwork()
    dat.network.on('connection', function (peer, type) {
      console.log('I connected to someone for ' + data)
      // console.log('got', peer, type)
      console.log('connected to', network.connections.length, 'peers')
    })
    // var archive = dat.archive;
  });
});

app.get('/deleteDat', function(req, res) {
  console.log("Deleting www dir containing the dat.")
  deleteFolderRecursive(dest)
  if (!fs.existsSync(dest)){
    console.log("Need to create the www directory.")
    fs.mkdirSync(dest)
    res.send('Dat deleted.');
  }
  fs.unlinkSync(datIdFile);

  // server.close(
  //   function() {
  //     app.listen(8080, function() {
  //       console.log("Server is back up.")
  //       res.send('Dat deleted.');
  //     });
  //   }
  // )
})


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

fs.readdir(dest, function(err, files) {
  if (!files.length) {
    // directory appears to be empty
    if (!fs.existsSync(index)){
      console.log("No Bunsen app here.")
      app.get('/', function( req, res) {
        res.send("");
        // res.send('<html><head><style>body { font-family: Roboto, Arial, sans-serif; }</style></head><body><div style="text-align: center; margin-top: 50px;"><img alt="bunsen-logo" src="data:image/png;base64,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"><p>&nbsp;</p><p>This is an empty Bunsen application. Enter a dat and go man go!</p></div></body></html>');
      });
    }
  }
});

var server = app.listen(8080);

