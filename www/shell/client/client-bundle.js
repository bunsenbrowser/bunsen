(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.RCPme = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var RPC = require('frame-rpc');

const bunsenAddress = "dat://fork-ui2-bunsen.hashbase.io/"
// const wikiAddress = "dat://wysiwywiki-bunsen.hashbase.io/"
const wikiAddress = "dat://528691905866112c90eea949bcc0712c208f0ac0803d38312dc18cfa7fda82d1/"


async function receiveMessage (event) {
// console.log(event.data)
  let data = event.data
  if (typeof data === 'string' && data.startsWith('dat:')) {
    let datAddress = data
    try {
      let forkedArchive = await DatArchive.fork(datAddress)
      console.log('we forked to', forkedArchive.url)
      // let theArchive = await DatArchive.selectArchive({})
      console.log('hey!')
      parent.location.reload()
    } catch (e) {
      console.log('Error: ' + e)
    }
  } else {
    if (typeof data.arguments !== 'undefined' && data.arguments.length > 1) {
      let url = data.arguments[1]
      if (typeof url === 'string' && url.startsWith('dat:')) {
        console.log('dat: ' + url)
        // let archive = await new DatArchive(url)
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', async (event) => {
  console.log('DOMContentLoaded in client')
    const searchBox = document.getElementById('search')
    searchBox.value = wikiAddress
    const openButton = document.getElementById('open')
     openButton.addEventListener('click', openDat)
    const forkButton = document.getElementById('fork')
     forkButton.addEventListener('click', forkDat)
    const wikiButton = document.getElementById('wiki')
    wikiButton.addEventListener('click', launchWiki)
    // Fit iframe to window.
    const frame = document.getElementById('view')
    setInterval(() => {
        view.style.height = `${window.innerHeight - 47}px`
    }, 500)

  // let archive = await DatArchive.selectArchive({})
  // await archive._loadPromise
  // let url = archive.url
  // console.log('primed selectArchive for ' + url)
  // let key = url.replace('dat://', '')
  // // find the correct secret key
  // let archives = JSON.parse(localStorage.getItem('archives'))
  // function getArchive (archive) {
  //   return archive.key === key
  // }
  //
  // let archiveKVP = archives.find(getArchive)
  // console.log('archive secretKey: ' + archiveKVP.secretKey)
  // // now pop it into our archive
  // // let secretKey = Buffer.from(archiveKVP.secretKey, 'hex')
  // // await archive._archive.metadata._storage.secretKey.write(0, secretKey)
  //
  // const contents = `
  //       <title>Gateway Test</title>
  //       <p>Hello World!</p>
  //       `
  // try {
  //   await archive.writeFile('sayHello.html', contents)
  //   console.log('Wrote sayHello.html to ' + url)
  //   alert('Wrote sayHello.html to ' + url)
  //   // change the iframe src to this url
  // } catch (e) {
  //   alert('Error: ' + e)
  //   console.log('Error: ' + e)
  // }
})

async function openDat () {
    const searchBox = document.getElementById('search')
    const datAddress = searchBox.value
    console.log('opening ' + datAddress)
    // frame.parent.contentWindow.postMessage(datAddress, '*')
    // try {
    //     let forkedArchive = await DatArchive.fork(datAddress)
    //     console.log('we forked to', forkedArchive.url)
    //     // let theArchive = await DatArchive.selectArchive({})
    //     console.log('hey!')
    //     parent.location.reload()
    // } catch (e) {
    //     console.log('Error: ' + e)
    // }
    iframe.src = this.serverUrl + this.bunsenAddress + "#" + datUri
}

async function forkDat () {
    const searchBox = document.getElementById('search')
    const datAddress = searchBox.value
    console.log('added ' + datAddress)
    // frame.parent.contentWindow.postMessage(datAddress, '*')
    try {
        let forkedArchive = await DatArchive.fork(datAddress)
        console.log('we forked to', forkedArchive.url)
        // let theArchive = await DatArchive.selectArchive({})
        console.log('hey!')
        parent.location.reload()
    } catch (e) {
        console.log('Error: ' + e)
    }
}

async function launchWiki() {
    console.log("launchWiki")
    let archive = await DatArchive.selectArchive({})
    await archive._loadPromise
    let url = archive.url
    console.log('primed selectArchive for ' + url)
    // now pop it into our archive
    // let secretKey = Buffer.from(archiveKVP.secretKey, 'hex')
    // await archive._archive.metadata._storage.secretKey.write(0, secretKey)
    const now = new Date();
    const contents = `
        <title>Gateway Test</title>
        <p>Hello World!</p>
        <p>${now}</p>
        `
    try {
        await archive.writeFile('sayHello.html', contents)
        console.log('Wrote sayHello.html to ' + url)

        // alert('Wrote sayHello.html to ' + url)
        let targetUrl = ''
        if (url.substr(0, 4) === 'dat:') {
            // Remove protocol and all slashes to be used in gateway address.
            let gatewayTarget = url.replace('dat://', '').replace('/', '')
            // Remove the base32 of bunsen.hashbase.io if the subdomain is base32 length, otherwise we're
            // probbaly not running in a gateway with base32 subdomain support.
            let gatewayParts = window.location.host.split('.')
            if (gatewayParts[0].length === 52) {
                gatewayParts.shift()
            }
            let gatewayRoot = gatewayParts.join('.')
            // targetUrl = `${window.location.protocol}//${gatewayRoot}/${gatewayTarget}/`
            targetUrl = `${window.location.protocol}//localhost:3000/${gatewayTarget}/`
        } else {
            targetUrl = url
        }
        // change the iframe src to this url
        // this.$.view.src = targetUrl
        console.log("targetUrl: " + targetUrl)
        const frame = document.getElementById('view')
        window.Bunsen = {}
        console.log("tell shell to open the frame via rpc.")
        // frame.parent.contentWindow.postMessage('OPEN' + targetUrl, '*')

        // window.Bunsen.archive = archive
        // frame.src = targetUrl;
        // frame.contentWindow.Bunsen = archive
    } catch (e) {
        alert('Error: ' + e)
        console.log('Error: ' + e)
    }
}

window.addEventListener('message', receiveMessage, false)

},{"frame-rpc":2}],2:[function(require,module,exports){
var isarray = require('isarray');
var hasf = Object.prototype.hasOwnProperty;
function has (obj, key) { return hasf.call(obj,key) }

var VERSION = '1.0.0';

module.exports = RPC;

function RPC (src, dst, origin, methods) {
    if (!(this instanceof RPC)) return new RPC(src, dst, origin, methods);
    var self = this;
    this.src = src;
    this.dst = dst;
    this._dstIsWorker = /Worker/.test(dst);
    
    if (origin === '*') {
        this.origin = '*';
    }
    else if (origin) {
        var uorigin = new URL(origin);
        this.origin = uorigin.protocol + '//' + uorigin.host;
    }
    
    this._sequence = 0;
    this._callbacks = {};
    
    this._onmessage = function (ev) {
        if (self._destroyed) return;
        if (self.origin !== '*' && ev.origin !== self.origin) return;
        if (!ev.data || typeof ev.data !== 'object') return;
        if (ev.data.protocol !== 'frame-rpc') return;
        if (!isarray(ev.data.arguments)) return;
        self._handle(ev.data);
    };
    this.src.addEventListener('message', this._onmessage);
    this._methods = (typeof methods === 'function'
        ? methods(this)
        : methods
    ) || {};
}

RPC.prototype.destroy = function () {
    this._destroyed = true;
    this.src.removeEventListener('message', this._onmessage);
};

RPC.prototype.call = function (method) {
    var args = [].slice.call(arguments, 1);
    return this.apply(method, args);
};

RPC.prototype.apply = function (method, args) {
    if (this._destroyed) return;
    var seq = this._sequence ++;
    if (typeof args[args.length - 1] === 'function') {
        this._callbacks[seq] = args[args.length - 1];
        args = args.slice(0, -1);
    }
    this._dstPostMessage({
        protocol: 'frame-rpc',
        version: VERSION,
        sequence: seq,
        method: method, 
        arguments: args
    });
};

RPC.prototype._dstPostMessage = function (msg) {
    if (this._dstIsWorker) {
        this.dst.postMessage(msg);
    }
    else {
        this.dst.postMessage(msg, this.origin);
    }
};

RPC.prototype._handle = function (msg) {
    var self = this;
    if (self._destroyed) return;
    if (has(msg, 'method')) {
        if (!has(this._methods, msg.method)) return;
        var args = msg.arguments.concat(function () {
            self._dstPostMessage({
                protocol: 'frame-rpc',
                version: VERSION,
                response: msg.sequence,
                arguments: [].slice.call(arguments)
            });
        });
        this._methods[msg.method].apply(this._methods, args);
    }
    else if (has(msg, 'response')) {
        var cb = this._callbacks[msg.response];
        delete this._callbacks[msg.response];
        if (cb) cb.apply(null, msg.arguments);
    }
};

},{"isarray":3}],3:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],"graceful-fs":[function(require,module,exports){

},{}]},{},[1])("graceful-fs")
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZnJhbWUtcnBjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZyYW1lLXJwYy9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsImZzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsInZhciBSUEMgPSByZXF1aXJlKCdmcmFtZS1ycGMnKTtcblxuY29uc3QgYnVuc2VuQWRkcmVzcyA9IFwiZGF0Oi8vZm9yay11aTItYnVuc2VuLmhhc2hiYXNlLmlvL1wiXG4vLyBjb25zdCB3aWtpQWRkcmVzcyA9IFwiZGF0Oi8vd3lzaXd5d2lraS1idW5zZW4uaGFzaGJhc2UuaW8vXCJcbmNvbnN0IHdpa2lBZGRyZXNzID0gXCJkYXQ6Ly81Mjg2OTE5MDU4NjYxMTJjOTBlZWE5NDliY2MwNzEyYzIwOGYwYWMwODAzZDM4MzEyZGMxOGNmYTdmZGE4MmQxL1wiXG5cblxuYXN5bmMgZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UgKGV2ZW50KSB7XG4vLyBjb25zb2xlLmxvZyhldmVudC5kYXRhKVxuICBsZXQgZGF0YSA9IGV2ZW50LmRhdGFcbiAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJyAmJiBkYXRhLnN0YXJ0c1dpdGgoJ2RhdDonKSkge1xuICAgIGxldCBkYXRBZGRyZXNzID0gZGF0YVxuICAgIHRyeSB7XG4gICAgICBsZXQgZm9ya2VkQXJjaGl2ZSA9IGF3YWl0IERhdEFyY2hpdmUuZm9yayhkYXRBZGRyZXNzKVxuICAgICAgY29uc29sZS5sb2coJ3dlIGZvcmtlZCB0bycsIGZvcmtlZEFyY2hpdmUudXJsKVxuICAgICAgLy8gbGV0IHRoZUFyY2hpdmUgPSBhd2FpdCBEYXRBcmNoaXZlLnNlbGVjdEFyY2hpdmUoe30pXG4gICAgICBjb25zb2xlLmxvZygnaGV5IScpXG4gICAgICBwYXJlbnQubG9jYXRpb24ucmVsb2FkKClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3I6ICcgKyBlKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAodHlwZW9mIGRhdGEuYXJndW1lbnRzICE9PSAndW5kZWZpbmVkJyAmJiBkYXRhLmFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICBsZXQgdXJsID0gZGF0YS5hcmd1bWVudHNbMV1cbiAgICAgIGlmICh0eXBlb2YgdXJsID09PSAnc3RyaW5nJyAmJiB1cmwuc3RhcnRzV2l0aCgnZGF0OicpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdkYXQ6ICcgKyB1cmwpXG4gICAgICAgIC8vIGxldCBhcmNoaXZlID0gYXdhaXQgbmV3IERhdEFyY2hpdmUodXJsKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgYXN5bmMgKGV2ZW50KSA9PiB7XG4gIGNvbnNvbGUubG9nKCdET01Db250ZW50TG9hZGVkIGluIGNsaWVudCcpXG4gICAgY29uc3Qgc2VhcmNoQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlYXJjaCcpXG4gICAgc2VhcmNoQm94LnZhbHVlID0gd2lraUFkZHJlc3NcbiAgICBjb25zdCBvcGVuQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29wZW4nKVxuICAgICBvcGVuQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb3BlbkRhdClcbiAgICBjb25zdCBmb3JrQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZvcmsnKVxuICAgICBmb3JrQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZm9ya0RhdClcbiAgICBjb25zdCB3aWtpQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dpa2knKVxuICAgIHdpa2lCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBsYXVuY2hXaWtpKVxuICAgIC8vIEZpdCBpZnJhbWUgdG8gd2luZG93LlxuICAgIGNvbnN0IGZyYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXcnKVxuICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgdmlldy5zdHlsZS5oZWlnaHQgPSBgJHt3aW5kb3cuaW5uZXJIZWlnaHQgLSA0N31weGBcbiAgICB9LCA1MDApXG5cbiAgLy8gbGV0IGFyY2hpdmUgPSBhd2FpdCBEYXRBcmNoaXZlLnNlbGVjdEFyY2hpdmUoe30pXG4gIC8vIGF3YWl0IGFyY2hpdmUuX2xvYWRQcm9taXNlXG4gIC8vIGxldCB1cmwgPSBhcmNoaXZlLnVybFxuICAvLyBjb25zb2xlLmxvZygncHJpbWVkIHNlbGVjdEFyY2hpdmUgZm9yICcgKyB1cmwpXG4gIC8vIGxldCBrZXkgPSB1cmwucmVwbGFjZSgnZGF0Oi8vJywgJycpXG4gIC8vIC8vIGZpbmQgdGhlIGNvcnJlY3Qgc2VjcmV0IGtleVxuICAvLyBsZXQgYXJjaGl2ZXMgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmNoaXZlcycpKVxuICAvLyBmdW5jdGlvbiBnZXRBcmNoaXZlIChhcmNoaXZlKSB7XG4gIC8vICAgcmV0dXJuIGFyY2hpdmUua2V5ID09PSBrZXlcbiAgLy8gfVxuICAvL1xuICAvLyBsZXQgYXJjaGl2ZUtWUCA9IGFyY2hpdmVzLmZpbmQoZ2V0QXJjaGl2ZSlcbiAgLy8gY29uc29sZS5sb2coJ2FyY2hpdmUgc2VjcmV0S2V5OiAnICsgYXJjaGl2ZUtWUC5zZWNyZXRLZXkpXG4gIC8vIC8vIG5vdyBwb3AgaXQgaW50byBvdXIgYXJjaGl2ZVxuICAvLyAvLyBsZXQgc2VjcmV0S2V5ID0gQnVmZmVyLmZyb20oYXJjaGl2ZUtWUC5zZWNyZXRLZXksICdoZXgnKVxuICAvLyAvLyBhd2FpdCBhcmNoaXZlLl9hcmNoaXZlLm1ldGFkYXRhLl9zdG9yYWdlLnNlY3JldEtleS53cml0ZSgwLCBzZWNyZXRLZXkpXG4gIC8vXG4gIC8vIGNvbnN0IGNvbnRlbnRzID0gYFxuICAvLyAgICAgICA8dGl0bGU+R2F0ZXdheSBUZXN0PC90aXRsZT5cbiAgLy8gICAgICAgPHA+SGVsbG8gV29ybGQhPC9wPlxuICAvLyAgICAgICBgXG4gIC8vIHRyeSB7XG4gIC8vICAgYXdhaXQgYXJjaGl2ZS53cml0ZUZpbGUoJ3NheUhlbGxvLmh0bWwnLCBjb250ZW50cylcbiAgLy8gICBjb25zb2xlLmxvZygnV3JvdGUgc2F5SGVsbG8uaHRtbCB0byAnICsgdXJsKVxuICAvLyAgIGFsZXJ0KCdXcm90ZSBzYXlIZWxsby5odG1sIHRvICcgKyB1cmwpXG4gIC8vICAgLy8gY2hhbmdlIHRoZSBpZnJhbWUgc3JjIHRvIHRoaXMgdXJsXG4gIC8vIH0gY2F0Y2ggKGUpIHtcbiAgLy8gICBhbGVydCgnRXJyb3I6ICcgKyBlKVxuICAvLyAgIGNvbnNvbGUubG9nKCdFcnJvcjogJyArIGUpXG4gIC8vIH1cbn0pXG5cbmFzeW5jIGZ1bmN0aW9uIG9wZW5EYXQgKCkge1xuICAgIGNvbnN0IHNlYXJjaEJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWFyY2gnKVxuICAgIGNvbnN0IGRhdEFkZHJlc3MgPSBzZWFyY2hCb3gudmFsdWVcbiAgICBjb25zb2xlLmxvZygnb3BlbmluZyAnICsgZGF0QWRkcmVzcylcbiAgICAvLyBmcmFtZS5wYXJlbnQuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZShkYXRBZGRyZXNzLCAnKicpXG4gICAgLy8gdHJ5IHtcbiAgICAvLyAgICAgbGV0IGZvcmtlZEFyY2hpdmUgPSBhd2FpdCBEYXRBcmNoaXZlLmZvcmsoZGF0QWRkcmVzcylcbiAgICAvLyAgICAgY29uc29sZS5sb2coJ3dlIGZvcmtlZCB0bycsIGZvcmtlZEFyY2hpdmUudXJsKVxuICAgIC8vICAgICAvLyBsZXQgdGhlQXJjaGl2ZSA9IGF3YWl0IERhdEFyY2hpdmUuc2VsZWN0QXJjaGl2ZSh7fSlcbiAgICAvLyAgICAgY29uc29sZS5sb2coJ2hleSEnKVxuICAgIC8vICAgICBwYXJlbnQubG9jYXRpb24ucmVsb2FkKClcbiAgICAvLyB9IGNhdGNoIChlKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKCdFcnJvcjogJyArIGUpXG4gICAgLy8gfVxuICAgIGlmcmFtZS5zcmMgPSB0aGlzLnNlcnZlclVybCArIHRoaXMuYnVuc2VuQWRkcmVzcyArIFwiI1wiICsgZGF0VXJpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZvcmtEYXQgKCkge1xuICAgIGNvbnN0IHNlYXJjaEJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWFyY2gnKVxuICAgIGNvbnN0IGRhdEFkZHJlc3MgPSBzZWFyY2hCb3gudmFsdWVcbiAgICBjb25zb2xlLmxvZygnYWRkZWQgJyArIGRhdEFkZHJlc3MpXG4gICAgLy8gZnJhbWUucGFyZW50LmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoZGF0QWRkcmVzcywgJyonKVxuICAgIHRyeSB7XG4gICAgICAgIGxldCBmb3JrZWRBcmNoaXZlID0gYXdhaXQgRGF0QXJjaGl2ZS5mb3JrKGRhdEFkZHJlc3MpXG4gICAgICAgIGNvbnNvbGUubG9nKCd3ZSBmb3JrZWQgdG8nLCBmb3JrZWRBcmNoaXZlLnVybClcbiAgICAgICAgLy8gbGV0IHRoZUFyY2hpdmUgPSBhd2FpdCBEYXRBcmNoaXZlLnNlbGVjdEFyY2hpdmUoe30pXG4gICAgICAgIGNvbnNvbGUubG9nKCdoZXkhJylcbiAgICAgICAgcGFyZW50LmxvY2F0aW9uLnJlbG9hZCgpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnRXJyb3I6ICcgKyBlKVxuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbGF1bmNoV2lraSgpIHtcbiAgICBjb25zb2xlLmxvZyhcImxhdW5jaFdpa2lcIilcbiAgICBsZXQgYXJjaGl2ZSA9IGF3YWl0IERhdEFyY2hpdmUuc2VsZWN0QXJjaGl2ZSh7fSlcbiAgICBhd2FpdCBhcmNoaXZlLl9sb2FkUHJvbWlzZVxuICAgIGxldCB1cmwgPSBhcmNoaXZlLnVybFxuICAgIGNvbnNvbGUubG9nKCdwcmltZWQgc2VsZWN0QXJjaGl2ZSBmb3IgJyArIHVybClcbiAgICAvLyBub3cgcG9wIGl0IGludG8gb3VyIGFyY2hpdmVcbiAgICAvLyBsZXQgc2VjcmV0S2V5ID0gQnVmZmVyLmZyb20oYXJjaGl2ZUtWUC5zZWNyZXRLZXksICdoZXgnKVxuICAgIC8vIGF3YWl0IGFyY2hpdmUuX2FyY2hpdmUubWV0YWRhdGEuX3N0b3JhZ2Uuc2VjcmV0S2V5LndyaXRlKDAsIHNlY3JldEtleSlcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IGNvbnRlbnRzID0gYFxuICAgICAgICA8dGl0bGU+R2F0ZXdheSBUZXN0PC90aXRsZT5cbiAgICAgICAgPHA+SGVsbG8gV29ybGQhPC9wPlxuICAgICAgICA8cD4ke25vd308L3A+XG4gICAgICAgIGBcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBhcmNoaXZlLndyaXRlRmlsZSgnc2F5SGVsbG8uaHRtbCcsIGNvbnRlbnRzKVxuICAgICAgICBjb25zb2xlLmxvZygnV3JvdGUgc2F5SGVsbG8uaHRtbCB0byAnICsgdXJsKVxuXG4gICAgICAgIC8vIGFsZXJ0KCdXcm90ZSBzYXlIZWxsby5odG1sIHRvICcgKyB1cmwpXG4gICAgICAgIGxldCB0YXJnZXRVcmwgPSAnJ1xuICAgICAgICBpZiAodXJsLnN1YnN0cigwLCA0KSA9PT0gJ2RhdDonKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgcHJvdG9jb2wgYW5kIGFsbCBzbGFzaGVzIHRvIGJlIHVzZWQgaW4gZ2F0ZXdheSBhZGRyZXNzLlxuICAgICAgICAgICAgbGV0IGdhdGV3YXlUYXJnZXQgPSB1cmwucmVwbGFjZSgnZGF0Oi8vJywgJycpLnJlcGxhY2UoJy8nLCAnJylcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgYmFzZTMyIG9mIGJ1bnNlbi5oYXNoYmFzZS5pbyBpZiB0aGUgc3ViZG9tYWluIGlzIGJhc2UzMiBsZW5ndGgsIG90aGVyd2lzZSB3ZSdyZVxuICAgICAgICAgICAgLy8gcHJvYmJhbHkgbm90IHJ1bm5pbmcgaW4gYSBnYXRld2F5IHdpdGggYmFzZTMyIHN1YmRvbWFpbiBzdXBwb3J0LlxuICAgICAgICAgICAgbGV0IGdhdGV3YXlQYXJ0cyA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0LnNwbGl0KCcuJylcbiAgICAgICAgICAgIGlmIChnYXRld2F5UGFydHNbMF0ubGVuZ3RoID09PSA1Mikge1xuICAgICAgICAgICAgICAgIGdhdGV3YXlQYXJ0cy5zaGlmdCgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZ2F0ZXdheVJvb3QgPSBnYXRld2F5UGFydHMuam9pbignLicpXG4gICAgICAgICAgICAvLyB0YXJnZXRVcmwgPSBgJHt3aW5kb3cubG9jYXRpb24ucHJvdG9jb2x9Ly8ke2dhdGV3YXlSb290fS8ke2dhdGV3YXlUYXJnZXR9L2BcbiAgICAgICAgICAgIHRhcmdldFVybCA9IGAke3dpbmRvdy5sb2NhdGlvbi5wcm90b2NvbH0vL2xvY2FsaG9zdDozMDAwLyR7Z2F0ZXdheVRhcmdldH0vYFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0VXJsID0gdXJsXG4gICAgICAgIH1cbiAgICAgICAgLy8gY2hhbmdlIHRoZSBpZnJhbWUgc3JjIHRvIHRoaXMgdXJsXG4gICAgICAgIC8vIHRoaXMuJC52aWV3LnNyYyA9IHRhcmdldFVybFxuICAgICAgICBjb25zb2xlLmxvZyhcInRhcmdldFVybDogXCIgKyB0YXJnZXRVcmwpXG4gICAgICAgIGNvbnN0IGZyYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXcnKVxuICAgICAgICB3aW5kb3cuQnVuc2VuID0ge31cbiAgICAgICAgY29uc29sZS5sb2coXCJ0ZWxsIHNoZWxsIHRvIG9wZW4gdGhlIGZyYW1lIHZpYSBycGMuXCIpXG4gICAgICAgIC8vIGZyYW1lLnBhcmVudC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCdPUEVOJyArIHRhcmdldFVybCwgJyonKVxuXG4gICAgICAgIC8vIHdpbmRvdy5CdW5zZW4uYXJjaGl2ZSA9IGFyY2hpdmVcbiAgICAgICAgLy8gZnJhbWUuc3JjID0gdGFyZ2V0VXJsO1xuICAgICAgICAvLyBmcmFtZS5jb250ZW50V2luZG93LkJ1bnNlbiA9IGFyY2hpdmVcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGFsZXJ0KCdFcnJvcjogJyArIGUpXG4gICAgICAgIGNvbnNvbGUubG9nKCdFcnJvcjogJyArIGUpXG4gICAgfVxufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSlcbiIsInZhciBpc2FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpO1xudmFyIGhhc2YgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuZnVuY3Rpb24gaGFzIChvYmosIGtleSkgeyByZXR1cm4gaGFzZi5jYWxsKG9iaixrZXkpIH1cblxudmFyIFZFUlNJT04gPSAnMS4wLjAnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJQQztcblxuZnVuY3Rpb24gUlBDIChzcmMsIGRzdCwgb3JpZ2luLCBtZXRob2RzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJQQykpIHJldHVybiBuZXcgUlBDKHNyYywgZHN0LCBvcmlnaW4sIG1ldGhvZHMpO1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnNyYyA9IHNyYztcbiAgICB0aGlzLmRzdCA9IGRzdDtcbiAgICB0aGlzLl9kc3RJc1dvcmtlciA9IC9Xb3JrZXIvLnRlc3QoZHN0KTtcbiAgICBcbiAgICBpZiAob3JpZ2luID09PSAnKicpIHtcbiAgICAgICAgdGhpcy5vcmlnaW4gPSAnKic7XG4gICAgfVxuICAgIGVsc2UgaWYgKG9yaWdpbikge1xuICAgICAgICB2YXIgdW9yaWdpbiA9IG5ldyBVUkwob3JpZ2luKTtcbiAgICAgICAgdGhpcy5vcmlnaW4gPSB1b3JpZ2luLnByb3RvY29sICsgJy8vJyArIHVvcmlnaW4uaG9zdDtcbiAgICB9XG4gICAgXG4gICAgdGhpcy5fc2VxdWVuY2UgPSAwO1xuICAgIHRoaXMuX2NhbGxiYWNrcyA9IHt9O1xuICAgIFxuICAgIHRoaXMuX29ubWVzc2FnZSA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICBpZiAoc2VsZi5fZGVzdHJveWVkKSByZXR1cm47XG4gICAgICAgIGlmIChzZWxmLm9yaWdpbiAhPT0gJyonICYmIGV2Lm9yaWdpbiAhPT0gc2VsZi5vcmlnaW4pIHJldHVybjtcbiAgICAgICAgaWYgKCFldi5kYXRhIHx8IHR5cGVvZiBldi5kYXRhICE9PSAnb2JqZWN0JykgcmV0dXJuO1xuICAgICAgICBpZiAoZXYuZGF0YS5wcm90b2NvbCAhPT0gJ2ZyYW1lLXJwYycpIHJldHVybjtcbiAgICAgICAgaWYgKCFpc2FycmF5KGV2LmRhdGEuYXJndW1lbnRzKSkgcmV0dXJuO1xuICAgICAgICBzZWxmLl9oYW5kbGUoZXYuZGF0YSk7XG4gICAgfTtcbiAgICB0aGlzLnNyYy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5fb25tZXNzYWdlKTtcbiAgICB0aGlzLl9tZXRob2RzID0gKHR5cGVvZiBtZXRob2RzID09PSAnZnVuY3Rpb24nXG4gICAgICAgID8gbWV0aG9kcyh0aGlzKVxuICAgICAgICA6IG1ldGhvZHNcbiAgICApIHx8IHt9O1xufVxuXG5SUEMucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcbiAgICB0aGlzLnNyYy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5fb25tZXNzYWdlKTtcbn07XG5cblJQQy5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gdGhpcy5hcHBseShtZXRob2QsIGFyZ3MpO1xufTtcblxuUlBDLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uIChtZXRob2QsIGFyZ3MpIHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSByZXR1cm47XG4gICAgdmFyIHNlcSA9IHRoaXMuX3NlcXVlbmNlICsrO1xuICAgIGlmICh0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuX2NhbGxiYWNrc1tzZXFdID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgICBhcmdzID0gYXJncy5zbGljZSgwLCAtMSk7XG4gICAgfVxuICAgIHRoaXMuX2RzdFBvc3RNZXNzYWdlKHtcbiAgICAgICAgcHJvdG9jb2w6ICdmcmFtZS1ycGMnLFxuICAgICAgICB2ZXJzaW9uOiBWRVJTSU9OLFxuICAgICAgICBzZXF1ZW5jZTogc2VxLFxuICAgICAgICBtZXRob2Q6IG1ldGhvZCwgXG4gICAgICAgIGFyZ3VtZW50czogYXJnc1xuICAgIH0pO1xufTtcblxuUlBDLnByb3RvdHlwZS5fZHN0UG9zdE1lc3NhZ2UgPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgaWYgKHRoaXMuX2RzdElzV29ya2VyKSB7XG4gICAgICAgIHRoaXMuZHN0LnBvc3RNZXNzYWdlKG1zZyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLmRzdC5wb3N0TWVzc2FnZShtc2csIHRoaXMub3JpZ2luKTtcbiAgICB9XG59O1xuXG5SUEMucHJvdG90eXBlLl9oYW5kbGUgPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLl9kZXN0cm95ZWQpIHJldHVybjtcbiAgICBpZiAoaGFzKG1zZywgJ21ldGhvZCcpKSB7XG4gICAgICAgIGlmICghaGFzKHRoaXMuX21ldGhvZHMsIG1zZy5tZXRob2QpKSByZXR1cm47XG4gICAgICAgIHZhciBhcmdzID0gbXNnLmFyZ3VtZW50cy5jb25jYXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5fZHN0UG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHByb3RvY29sOiAnZnJhbWUtcnBjJyxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBWRVJTSU9OLFxuICAgICAgICAgICAgICAgIHJlc3BvbnNlOiBtc2cuc2VxdWVuY2UsXG4gICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fbWV0aG9kc1ttc2cubWV0aG9kXS5hcHBseSh0aGlzLl9tZXRob2RzLCBhcmdzKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaGFzKG1zZywgJ3Jlc3BvbnNlJykpIHtcbiAgICAgICAgdmFyIGNiID0gdGhpcy5fY2FsbGJhY2tzW21zZy5yZXNwb25zZV07XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbbXNnLnJlc3BvbnNlXTtcbiAgICAgICAgaWYgKGNiKSBjYi5hcHBseShudWxsLCBtc2cuYXJndW1lbnRzKTtcbiAgICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiIl19
