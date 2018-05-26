(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.RCPme = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var RPC = require('frame-rpc');

const bunsenAddress = "fork-ui2-bunsen.hashbase.io/"


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
    searchBox.value = bunsenAddress
    const goButton = document.getElementById('go')
     goButton.addEventListener('click', forkDat)
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZnJhbWUtcnBjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZyYW1lLXJwYy9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsImZzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ2YXIgUlBDID0gcmVxdWlyZSgnZnJhbWUtcnBjJyk7XG5cbmNvbnN0IGJ1bnNlbkFkZHJlc3MgPSBcImZvcmstdWkyLWJ1bnNlbi5oYXNoYmFzZS5pby9cIlxuXG5cbmFzeW5jIGZ1bmN0aW9uIHJlY2VpdmVNZXNzYWdlIChldmVudCkge1xuLy8gY29uc29sZS5sb2coZXZlbnQuZGF0YSlcbiAgbGV0IGRhdGEgPSBldmVudC5kYXRhXG4gIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycgJiYgZGF0YS5zdGFydHNXaXRoKCdkYXQ6JykpIHtcbiAgICBsZXQgZGF0QWRkcmVzcyA9IGRhdGFcbiAgICB0cnkge1xuICAgICAgbGV0IGZvcmtlZEFyY2hpdmUgPSBhd2FpdCBEYXRBcmNoaXZlLmZvcmsoZGF0QWRkcmVzcylcbiAgICAgIGNvbnNvbGUubG9nKCd3ZSBmb3JrZWQgdG8nLCBmb3JrZWRBcmNoaXZlLnVybClcbiAgICAgIC8vIGxldCB0aGVBcmNoaXZlID0gYXdhaXQgRGF0QXJjaGl2ZS5zZWxlY3RBcmNoaXZlKHt9KVxuICAgICAgY29uc29sZS5sb2coJ2hleSEnKVxuICAgICAgcGFyZW50LmxvY2F0aW9uLnJlbG9hZCgpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yOiAnICsgZSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHR5cGVvZiBkYXRhLmFyZ3VtZW50cyAhPT0gJ3VuZGVmaW5lZCcgJiYgZGF0YS5hcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgbGV0IHVybCA9IGRhdGEuYXJndW1lbnRzWzFdXG4gICAgICBpZiAodHlwZW9mIHVybCA9PT0gJ3N0cmluZycgJiYgdXJsLnN0YXJ0c1dpdGgoJ2RhdDonKSkge1xuICAgICAgICBjb25zb2xlLmxvZygnZGF0OiAnICsgdXJsKVxuICAgICAgICAvLyBsZXQgYXJjaGl2ZSA9IGF3YWl0IG5ldyBEYXRBcmNoaXZlKHVybClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGFzeW5jIChldmVudCkgPT4ge1xuICBjb25zb2xlLmxvZygnRE9NQ29udGVudExvYWRlZCBpbiBjbGllbnQnKVxuICAgIGNvbnN0IHNlYXJjaEJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWFyY2gnKVxuICAgIHNlYXJjaEJveC52YWx1ZSA9IGJ1bnNlbkFkZHJlc3NcbiAgICBjb25zdCBnb0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnbycpXG4gICAgIGdvQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZm9ya0RhdClcbiAgICAvLyBGaXQgaWZyYW1lIHRvIHdpbmRvdy5cbiAgICBjb25zdCBmcmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3JylcbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIHZpZXcuc3R5bGUuaGVpZ2h0ID0gYCR7d2luZG93LmlubmVySGVpZ2h0IC0gNDd9cHhgXG4gICAgfSwgNTAwKVxuXG4gIC8vIGxldCBhcmNoaXZlID0gYXdhaXQgRGF0QXJjaGl2ZS5zZWxlY3RBcmNoaXZlKHt9KVxuICAvLyBhd2FpdCBhcmNoaXZlLl9sb2FkUHJvbWlzZVxuICAvLyBsZXQgdXJsID0gYXJjaGl2ZS51cmxcbiAgLy8gY29uc29sZS5sb2coJ3ByaW1lZCBzZWxlY3RBcmNoaXZlIGZvciAnICsgdXJsKVxuICAvLyBsZXQga2V5ID0gdXJsLnJlcGxhY2UoJ2RhdDovLycsICcnKVxuICAvLyAvLyBmaW5kIHRoZSBjb3JyZWN0IHNlY3JldCBrZXlcbiAgLy8gbGV0IGFyY2hpdmVzID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJjaGl2ZXMnKSlcbiAgLy8gZnVuY3Rpb24gZ2V0QXJjaGl2ZSAoYXJjaGl2ZSkge1xuICAvLyAgIHJldHVybiBhcmNoaXZlLmtleSA9PT0ga2V5XG4gIC8vIH1cbiAgLy9cbiAgLy8gbGV0IGFyY2hpdmVLVlAgPSBhcmNoaXZlcy5maW5kKGdldEFyY2hpdmUpXG4gIC8vIGNvbnNvbGUubG9nKCdhcmNoaXZlIHNlY3JldEtleTogJyArIGFyY2hpdmVLVlAuc2VjcmV0S2V5KVxuICAvLyAvLyBub3cgcG9wIGl0IGludG8gb3VyIGFyY2hpdmVcbiAgLy8gLy8gbGV0IHNlY3JldEtleSA9IEJ1ZmZlci5mcm9tKGFyY2hpdmVLVlAuc2VjcmV0S2V5LCAnaGV4JylcbiAgLy8gLy8gYXdhaXQgYXJjaGl2ZS5fYXJjaGl2ZS5tZXRhZGF0YS5fc3RvcmFnZS5zZWNyZXRLZXkud3JpdGUoMCwgc2VjcmV0S2V5KVxuICAvL1xuICAvLyBjb25zdCBjb250ZW50cyA9IGBcbiAgLy8gICAgICAgPHRpdGxlPkdhdGV3YXkgVGVzdDwvdGl0bGU+XG4gIC8vICAgICAgIDxwPkhlbGxvIFdvcmxkITwvcD5cbiAgLy8gICAgICAgYFxuICAvLyB0cnkge1xuICAvLyAgIGF3YWl0IGFyY2hpdmUud3JpdGVGaWxlKCdzYXlIZWxsby5odG1sJywgY29udGVudHMpXG4gIC8vICAgY29uc29sZS5sb2coJ1dyb3RlIHNheUhlbGxvLmh0bWwgdG8gJyArIHVybClcbiAgLy8gICBhbGVydCgnV3JvdGUgc2F5SGVsbG8uaHRtbCB0byAnICsgdXJsKVxuICAvLyAgIC8vIGNoYW5nZSB0aGUgaWZyYW1lIHNyYyB0byB0aGlzIHVybFxuICAvLyB9IGNhdGNoIChlKSB7XG4gIC8vICAgYWxlcnQoJ0Vycm9yOiAnICsgZSlcbiAgLy8gICBjb25zb2xlLmxvZygnRXJyb3I6ICcgKyBlKVxuICAvLyB9XG59KVxuXG5hc3luYyBmdW5jdGlvbiBmb3JrRGF0ICgpIHtcbiAgICBjb25zdCBzZWFyY2hCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VhcmNoJylcbiAgICBjb25zdCBkYXRBZGRyZXNzID0gc2VhcmNoQm94LnZhbHVlXG4gICAgY29uc29sZS5sb2coJ2FkZGVkICcgKyBkYXRBZGRyZXNzKVxuICAgIC8vIGZyYW1lLnBhcmVudC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKGRhdEFkZHJlc3MsICcqJylcbiAgICB0cnkge1xuICAgICAgICBsZXQgZm9ya2VkQXJjaGl2ZSA9IGF3YWl0IERhdEFyY2hpdmUuZm9yayhkYXRBZGRyZXNzKVxuICAgICAgICBjb25zb2xlLmxvZygnd2UgZm9ya2VkIHRvJywgZm9ya2VkQXJjaGl2ZS51cmwpXG4gICAgICAgIC8vIGxldCB0aGVBcmNoaXZlID0gYXdhaXQgRGF0QXJjaGl2ZS5zZWxlY3RBcmNoaXZlKHt9KVxuICAgICAgICBjb25zb2xlLmxvZygnaGV5IScpXG4gICAgICAgIHBhcmVudC5sb2NhdGlvbi5yZWxvYWQoKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yOiAnICsgZSlcbiAgICB9XG59XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKVxuIiwidmFyIGlzYXJyYXkgPSByZXF1aXJlKCdpc2FycmF5Jyk7XG52YXIgaGFzZiA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5mdW5jdGlvbiBoYXMgKG9iaiwga2V5KSB7IHJldHVybiBoYXNmLmNhbGwob2JqLGtleSkgfVxuXG52YXIgVkVSU0lPTiA9ICcxLjAuMCc7XG5cbm1vZHVsZS5leHBvcnRzID0gUlBDO1xuXG5mdW5jdGlvbiBSUEMgKHNyYywgZHN0LCBvcmlnaW4sIG1ldGhvZHMpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUlBDKSkgcmV0dXJuIG5ldyBSUEMoc3JjLCBkc3QsIG9yaWdpbiwgbWV0aG9kcyk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuc3JjID0gc3JjO1xuICAgIHRoaXMuZHN0ID0gZHN0O1xuICAgIHRoaXMuX2RzdElzV29ya2VyID0gL1dvcmtlci8udGVzdChkc3QpO1xuICAgIFxuICAgIGlmIChvcmlnaW4gPT09ICcqJykge1xuICAgICAgICB0aGlzLm9yaWdpbiA9ICcqJztcbiAgICB9XG4gICAgZWxzZSBpZiAob3JpZ2luKSB7XG4gICAgICAgIHZhciB1b3JpZ2luID0gbmV3IFVSTChvcmlnaW4pO1xuICAgICAgICB0aGlzLm9yaWdpbiA9IHVvcmlnaW4ucHJvdG9jb2wgKyAnLy8nICsgdW9yaWdpbi5ob3N0O1xuICAgIH1cbiAgICBcbiAgICB0aGlzLl9zZXF1ZW5jZSA9IDA7XG4gICAgdGhpcy5fY2FsbGJhY2tzID0ge307XG4gICAgXG4gICAgdGhpcy5fb25tZXNzYWdlID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgIGlmIChzZWxmLl9kZXN0cm95ZWQpIHJldHVybjtcbiAgICAgICAgaWYgKHNlbGYub3JpZ2luICE9PSAnKicgJiYgZXYub3JpZ2luICE9PSBzZWxmLm9yaWdpbikgcmV0dXJuO1xuICAgICAgICBpZiAoIWV2LmRhdGEgfHwgdHlwZW9mIGV2LmRhdGEgIT09ICdvYmplY3QnKSByZXR1cm47XG4gICAgICAgIGlmIChldi5kYXRhLnByb3RvY29sICE9PSAnZnJhbWUtcnBjJykgcmV0dXJuO1xuICAgICAgICBpZiAoIWlzYXJyYXkoZXYuZGF0YS5hcmd1bWVudHMpKSByZXR1cm47XG4gICAgICAgIHNlbGYuX2hhbmRsZShldi5kYXRhKTtcbiAgICB9O1xuICAgIHRoaXMuc3JjLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLl9vbm1lc3NhZ2UpO1xuICAgIHRoaXMuX21ldGhvZHMgPSAodHlwZW9mIG1ldGhvZHMgPT09ICdmdW5jdGlvbidcbiAgICAgICAgPyBtZXRob2RzKHRoaXMpXG4gICAgICAgIDogbWV0aG9kc1xuICAgICkgfHwge307XG59XG5cblJQQy5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuICAgIHRoaXMuc3JjLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLl9vbm1lc3NhZ2UpO1xufTtcblxuUlBDLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiB0aGlzLmFwcGx5KG1ldGhvZCwgYXJncyk7XG59O1xuXG5SUEMucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24gKG1ldGhvZCwgYXJncykge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHJldHVybjtcbiAgICB2YXIgc2VxID0gdGhpcy5fc2VxdWVuY2UgKys7XG4gICAgaWYgKHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5fY2FsbGJhY2tzW3NlcV0gPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDAsIC0xKTtcbiAgICB9XG4gICAgdGhpcy5fZHN0UG9zdE1lc3NhZ2Uoe1xuICAgICAgICBwcm90b2NvbDogJ2ZyYW1lLXJwYycsXG4gICAgICAgIHZlcnNpb246IFZFUlNJT04sXG4gICAgICAgIHNlcXVlbmNlOiBzZXEsXG4gICAgICAgIG1ldGhvZDogbWV0aG9kLCBcbiAgICAgICAgYXJndW1lbnRzOiBhcmdzXG4gICAgfSk7XG59O1xuXG5SUEMucHJvdG90eXBlLl9kc3RQb3N0TWVzc2FnZSA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICBpZiAodGhpcy5fZHN0SXNXb3JrZXIpIHtcbiAgICAgICAgdGhpcy5kc3QucG9zdE1lc3NhZ2UobXNnKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMuZHN0LnBvc3RNZXNzYWdlKG1zZywgdGhpcy5vcmlnaW4pO1xuICAgIH1cbn07XG5cblJQQy5wcm90b3R5cGUuX2hhbmRsZSA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2Rlc3Ryb3llZCkgcmV0dXJuO1xuICAgIGlmIChoYXMobXNnLCAnbWV0aG9kJykpIHtcbiAgICAgICAgaWYgKCFoYXModGhpcy5fbWV0aG9kcywgbXNnLm1ldGhvZCkpIHJldHVybjtcbiAgICAgICAgdmFyIGFyZ3MgPSBtc2cuYXJndW1lbnRzLmNvbmNhdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLl9kc3RQb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgcHJvdG9jb2w6ICdmcmFtZS1ycGMnLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IFZFUlNJT04sXG4gICAgICAgICAgICAgICAgcmVzcG9uc2U6IG1zZy5zZXF1ZW5jZSxcbiAgICAgICAgICAgICAgICBhcmd1bWVudHM6IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9tZXRob2RzW21zZy5tZXRob2RdLmFwcGx5KHRoaXMuX21ldGhvZHMsIGFyZ3MpO1xuICAgIH1cbiAgICBlbHNlIGlmIChoYXMobXNnLCAncmVzcG9uc2UnKSkge1xuICAgICAgICB2YXIgY2IgPSB0aGlzLl9jYWxsYmFja3NbbXNnLnJlc3BvbnNlXTtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2NhbGxiYWNrc1ttc2cucmVzcG9uc2VdO1xuICAgICAgICBpZiAoY2IpIGNiLmFwcGx5KG51bGwsIG1zZy5hcmd1bWVudHMpO1xuICAgIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFycikgPT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIiXX0=
