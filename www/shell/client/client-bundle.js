(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.RCPme = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var RPC = require('frame-rpc');
const serverUrl = 'http://localhost:3000/';

const bunsenAddress = "dat://home-bunsen.hashbase.io/"
// const bunsenAddress = "dat://fork-ui2-bunsen.hashbase.io/"
// const wikiAddress = "dat://wysiwywiki-bunsen.hashbase.io/"
const wikiAddress = "dat://528691905866112c90eea949bcc0712c208f0ac0803d38312dc18cfa7fda82d1/"
let currentAddress = ""

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
    const addressBox = document.getElementById('address')
    addressBox.value = bunsenAddress
    const openButton = document.getElementById('open')
    openButton.addEventListener('click', refresh)
    const sitesButton = document.getElementById('sites')
    sitesButton.addEventListener('click', clearAddress)
    window.addEventListener('hashchange', () => hashHasChanged())
    // Handle focus on dat url input.
    addressBox.addEventListener('focusin', () => {
        console.log("focusin")
        showDatSites();
    })
    // Remove spaces that keyboards add after `.` character.
    addressBox.addEventListener('keyup', async (event) => {
        event.target.value = event.target.value.replace(' ', '')
    })

    // Listen for submit of new URL.
    addressBox.addEventListener('keyup', async (event) => {
        if (event.keyCode !== 13) return
        this.openAddress(addressBox.value)
    })

    // Fit iframe to window.
    const frame = document.getElementById('view')
    setInterval(() => {
        view.style.height = `${window.innerHeight - 47}px`
    }, 500)

    // Adjustments for browsers that are not Bunsen.
    if (!navigator.userAgent.includes('BunsenBrowser')) {
        // Alert folks who are not using Bunsen.
        if (!localStorage.getItem('suppressInstallBanner')) {
            // @TODO Show a hide button to set this to false.
            //this.showInstallBanner = true
        }
        try {
            // Register to handle dat:// links.
            navigator.registerProtocolHandler("dat",
                window.location+'?uri=%s',
                "Bunsen Browser");
        } catch (err) {
            // Transform dat:// Anchor tags to point at gateway.
            // @TODO Remove me or check for non-subdomain supported gateway. No longer possible because dat sites are on seperate subdomains.
            /*
            setInterval(() => {
              this.$.view.contentDocument.querySelectorAll('a').forEach(anchorEl => {
                let href = anchorEl.getAttribute('href')
                if (href && href.substr(0,6) === 'dat://') {
                  anchorEl.setAttribute('href', `${this.gateway}/${href.substr(6, href.length)}/`)
                }
              }, 500)
            })
            */
        }

    }

    // Open an address to get started.
    // Detect case of Firefox registered protocol handling.
    if (window.location.search.includes('?uri=')) {
        let frag = decodeURIComponent(window.location.search)
        let datAddress = frag.substr(5, frag.length)
        this.openAddress(datAddress)
    } else if (window.location.hash !== '') {
        hashHasChanged()
    } else {
        openAddress('dat://home-bunsen.hashbase.io')
    }
})

async function openAddress(address) {
    currentAddress = address
    let addressInput = document.querySelector("#address");
    let datListing = document.querySelector("#datListing");
    let iframe = document.querySelector("#view");
    addressInput.value = address

    // Show some stuff, hide some stuff. @TODO Make this simpler, too much juggling.
    // this.$.datSites.style.display = 'none'
    // this.$.peerage.style.display = 'none'
    // this.$.view.style.display = 'block'
    // this.$.view.style.background = `white`

    // Remove focus from address bar.
    addressInput.blur()
    // Save this address into history.
    const datSites = localStorage.getItem('datSites')
    if (datSites) {
        const datSiteItems = JSON.parse(datSites)
        let hasAddress = false
        for (var key in datSiteItems) {
            if (datSiteItems.hasOwnProperty(key)) {
                console.log(key + " -> " + JSON.stringify(datSiteItems[key]));
                if (datSiteItems[key].address === address) {
                    hasAddress = true
                }
            }
        }
        if (!hasAddress) {
            datSiteItems.unshift({ address: address })
            // this.$.datSites.items = datSiteItems
            localStorage.setItem('datSites', JSON.stringify(datSiteItems))
        }
    } else {
        localStorage.setItem('datSites', `[{"address": "${address}"}]`)
    }
    // Check if the target uses Dat protocol, otherwise it's something weird like http ;).
    let targetUrl = ''
    if (address.substr(0,4) === 'dat:') {
        // Remove protocol and all slashes to be used in gateway address.
        let gatewayTarget = address.replace('dat://', '').replace('/', '')
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
        targetUrl = address
    }
    console.log("opening targetUrl: " + targetUrl)
    iframe.src = targetUrl
}

async function refresh() {
    openAddress(currentAddress)
}

async function hashHasChanged() {
    let addressInput = document.querySelector("#address");
    let address = window.location.hash.substr(1, window.location.hash.length)
    addressInput.value = address
    openAddress(address)
}

async function clearAddress() {
    let addressInput = document.querySelector("#address");
    addressInput.value = ''
    // Focus back after 200 milliseconds. Delay is a quirk of animations in paper-input.
    setTimeout(() => {
        addressInput.focus()
        showDatSites()
    }, 200)
}

async function showDatSites() {
    let addressInput = document.querySelector("#address");
    let datListing = document.querySelector("#datListing");
    let iframe = document.querySelector("#view");
    const datSites = localStorage.getItem('datSites')
    if (datSites) {
        const datSiteItems = JSON.parse(datSites)
        const tmpl = dats => `
            <table>
            ${dats.map(dat => `
                <tr><td><a href="${dat.address}">${dat.address}</a></td></tr>
            `).join('')}
            </table>
        `;
        // console.log(tmpl(datSiteItems));
        datListing.innerHTML = tmpl(datSiteItems);
    } else {
        localStorage.setItem('datSites', '[]')
    }
    addressInput.isFocused = true
    iframe.style.display = 'none'
    datListing.style.display = 'block'
    // this.$.peerage.style.display = 'block'
}

async function openDat () {
    const addressBox = document.getElementById('address')
    const url = addressBox.value
    console.log('opening ' + url)
    const frame = document.getElementById('view')
    // frame.parent.contentWindow.postMessage(datAddress, '*')
    // iframe.src = this.serverUrl + this.bunsenAddress + "#" + datUri
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
    // frame.src = targetUrl
    // frame.src = "http://localhost:3000/5f1a97ffd5081b151cd85940e3797cdec82700f724fda981c4e9c7a5b29c335a/"
    frame.src = "http://bwd9fzyn10dha76rb50e6ybwvv42e07q4kyuk0e4x73ubcmw6dd0.localhost:3000/"
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZnJhbWUtcnBjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZyYW1lLXJwYy9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsImZzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsInZhciBSUEMgPSByZXF1aXJlKCdmcmFtZS1ycGMnKTtcbmNvbnN0IHNlcnZlclVybCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvJztcblxuY29uc3QgYnVuc2VuQWRkcmVzcyA9IFwiZGF0Oi8vaG9tZS1idW5zZW4uaGFzaGJhc2UuaW8vXCJcbi8vIGNvbnN0IGJ1bnNlbkFkZHJlc3MgPSBcImRhdDovL2ZvcmstdWkyLWJ1bnNlbi5oYXNoYmFzZS5pby9cIlxuLy8gY29uc3Qgd2lraUFkZHJlc3MgPSBcImRhdDovL3d5c2l3eXdpa2ktYnVuc2VuLmhhc2hiYXNlLmlvL1wiXG5jb25zdCB3aWtpQWRkcmVzcyA9IFwiZGF0Oi8vNTI4NjkxOTA1ODY2MTEyYzkwZWVhOTQ5YmNjMDcxMmMyMDhmMGFjMDgwM2QzODMxMmRjMThjZmE3ZmRhODJkMS9cIlxubGV0IGN1cnJlbnRBZGRyZXNzID0gXCJcIlxuXG5hc3luYyBmdW5jdGlvbiByZWNlaXZlTWVzc2FnZSAoZXZlbnQpIHtcbi8vIGNvbnNvbGUubG9nKGV2ZW50LmRhdGEpXG4gIGxldCBkYXRhID0gZXZlbnQuZGF0YVxuICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnICYmIGRhdGEuc3RhcnRzV2l0aCgnZGF0OicpKSB7XG4gICAgbGV0IGRhdEFkZHJlc3MgPSBkYXRhXG4gICAgdHJ5IHtcbiAgICAgIGxldCBmb3JrZWRBcmNoaXZlID0gYXdhaXQgRGF0QXJjaGl2ZS5mb3JrKGRhdEFkZHJlc3MpXG4gICAgICBjb25zb2xlLmxvZygnd2UgZm9ya2VkIHRvJywgZm9ya2VkQXJjaGl2ZS51cmwpXG4gICAgICAvLyBsZXQgdGhlQXJjaGl2ZSA9IGF3YWl0IERhdEFyY2hpdmUuc2VsZWN0QXJjaGl2ZSh7fSlcbiAgICAgIGNvbnNvbGUubG9nKCdoZXkhJylcbiAgICAgIHBhcmVudC5sb2NhdGlvbi5yZWxvYWQoKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvcjogJyArIGUpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICh0eXBlb2YgZGF0YS5hcmd1bWVudHMgIT09ICd1bmRlZmluZWQnICYmIGRhdGEuYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGxldCB1cmwgPSBkYXRhLmFyZ3VtZW50c1sxXVxuICAgICAgaWYgKHR5cGVvZiB1cmwgPT09ICdzdHJpbmcnICYmIHVybC5zdGFydHNXaXRoKCdkYXQ6JykpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2RhdDogJyArIHVybClcbiAgICAgICAgLy8gbGV0IGFyY2hpdmUgPSBhd2FpdCBuZXcgRGF0QXJjaGl2ZSh1cmwpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBhc3luYyAoZXZlbnQpID0+IHtcbiAgY29uc29sZS5sb2coJ0RPTUNvbnRlbnRMb2FkZWQgaW4gY2xpZW50JylcbiAgICBjb25zdCBhZGRyZXNzQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZHJlc3MnKVxuICAgIGFkZHJlc3NCb3gudmFsdWUgPSBidW5zZW5BZGRyZXNzXG4gICAgY29uc3Qgb3BlbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvcGVuJylcbiAgICBvcGVuQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcmVmcmVzaClcbiAgICBjb25zdCBzaXRlc0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaXRlcycpXG4gICAgc2l0ZXNCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjbGVhckFkZHJlc3MpXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCAoKSA9PiBoYXNoSGFzQ2hhbmdlZCgpKVxuICAgIC8vIEhhbmRsZSBmb2N1cyBvbiBkYXQgdXJsIGlucHV0LlxuICAgIGFkZHJlc3NCb3guYWRkRXZlbnRMaXN0ZW5lcignZm9jdXNpbicsICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJmb2N1c2luXCIpXG4gICAgICAgIHNob3dEYXRTaXRlcygpO1xuICAgIH0pXG4gICAgLy8gUmVtb3ZlIHNwYWNlcyB0aGF0IGtleWJvYXJkcyBhZGQgYWZ0ZXIgYC5gIGNoYXJhY3Rlci5cbiAgICBhZGRyZXNzQm94LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnRhcmdldC52YWx1ZSA9IGV2ZW50LnRhcmdldC52YWx1ZS5yZXBsYWNlKCcgJywgJycpXG4gICAgfSlcblxuICAgIC8vIExpc3RlbiBmb3Igc3VibWl0IG9mIG5ldyBVUkwuXG4gICAgYWRkcmVzc0JveC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSAhPT0gMTMpIHJldHVyblxuICAgICAgICB0aGlzLm9wZW5BZGRyZXNzKGFkZHJlc3NCb3gudmFsdWUpXG4gICAgfSlcblxuICAgIC8vIEZpdCBpZnJhbWUgdG8gd2luZG93LlxuICAgIGNvbnN0IGZyYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXcnKVxuICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgdmlldy5zdHlsZS5oZWlnaHQgPSBgJHt3aW5kb3cuaW5uZXJIZWlnaHQgLSA0N31weGBcbiAgICB9LCA1MDApXG5cbiAgICAvLyBBZGp1c3RtZW50cyBmb3IgYnJvd3NlcnMgdGhhdCBhcmUgbm90IEJ1bnNlbi5cbiAgICBpZiAoIW5hdmlnYXRvci51c2VyQWdlbnQuaW5jbHVkZXMoJ0J1bnNlbkJyb3dzZXInKSkge1xuICAgICAgICAvLyBBbGVydCBmb2xrcyB3aG8gYXJlIG5vdCB1c2luZyBCdW5zZW4uXG4gICAgICAgIGlmICghbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3N1cHByZXNzSW5zdGFsbEJhbm5lcicpKSB7XG4gICAgICAgICAgICAvLyBAVE9ETyBTaG93IGEgaGlkZSBidXR0b24gdG8gc2V0IHRoaXMgdG8gZmFsc2UuXG4gICAgICAgICAgICAvL3RoaXMuc2hvd0luc3RhbGxCYW5uZXIgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFJlZ2lzdGVyIHRvIGhhbmRsZSBkYXQ6Ly8gbGlua3MuXG4gICAgICAgICAgICBuYXZpZ2F0b3IucmVnaXN0ZXJQcm90b2NvbEhhbmRsZXIoXCJkYXRcIixcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24rJz91cmk9JXMnLFxuICAgICAgICAgICAgICAgIFwiQnVuc2VuIEJyb3dzZXJcIik7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgLy8gVHJhbnNmb3JtIGRhdDovLyBBbmNob3IgdGFncyB0byBwb2ludCBhdCBnYXRld2F5LlxuICAgICAgICAgICAgLy8gQFRPRE8gUmVtb3ZlIG1lIG9yIGNoZWNrIGZvciBub24tc3ViZG9tYWluIHN1cHBvcnRlZCBnYXRld2F5LiBObyBsb25nZXIgcG9zc2libGUgYmVjYXVzZSBkYXQgc2l0ZXMgYXJlIG9uIHNlcGVyYXRlIHN1YmRvbWFpbnMuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLiQudmlldy5jb250ZW50RG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYScpLmZvckVhY2goYW5jaG9yRWwgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBocmVmID0gYW5jaG9yRWwuZ2V0QXR0cmlidXRlKCdocmVmJylcbiAgICAgICAgICAgICAgICBpZiAoaHJlZiAmJiBocmVmLnN1YnN0cigwLDYpID09PSAnZGF0Oi8vJykge1xuICAgICAgICAgICAgICAgICAgYW5jaG9yRWwuc2V0QXR0cmlidXRlKCdocmVmJywgYCR7dGhpcy5nYXRld2F5fS8ke2hyZWYuc3Vic3RyKDYsIGhyZWYubGVuZ3RoKX0vYClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIDUwMClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAqL1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvLyBPcGVuIGFuIGFkZHJlc3MgdG8gZ2V0IHN0YXJ0ZWQuXG4gICAgLy8gRGV0ZWN0IGNhc2Ugb2YgRmlyZWZveCByZWdpc3RlcmVkIHByb3RvY29sIGhhbmRsaW5nLlxuICAgIGlmICh3aW5kb3cubG9jYXRpb24uc2VhcmNoLmluY2x1ZGVzKCc/dXJpPScpKSB7XG4gICAgICAgIGxldCBmcmFnID0gZGVjb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpXG4gICAgICAgIGxldCBkYXRBZGRyZXNzID0gZnJhZy5zdWJzdHIoNSwgZnJhZy5sZW5ndGgpXG4gICAgICAgIHRoaXMub3BlbkFkZHJlc3MoZGF0QWRkcmVzcylcbiAgICB9IGVsc2UgaWYgKHdpbmRvdy5sb2NhdGlvbi5oYXNoICE9PSAnJykge1xuICAgICAgICBoYXNoSGFzQ2hhbmdlZCgpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgb3BlbkFkZHJlc3MoJ2RhdDovL2hvbWUtYnVuc2VuLmhhc2hiYXNlLmlvJylcbiAgICB9XG59KVxuXG5hc3luYyBmdW5jdGlvbiBvcGVuQWRkcmVzcyhhZGRyZXNzKSB7XG4gICAgY3VycmVudEFkZHJlc3MgPSBhZGRyZXNzXG4gICAgbGV0IGFkZHJlc3NJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYWRkcmVzc1wiKTtcbiAgICBsZXQgZGF0TGlzdGluZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZGF0TGlzdGluZ1wiKTtcbiAgICBsZXQgaWZyYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpO1xuICAgIGFkZHJlc3NJbnB1dC52YWx1ZSA9IGFkZHJlc3NcblxuICAgIC8vIFNob3cgc29tZSBzdHVmZiwgaGlkZSBzb21lIHN0dWZmLiBAVE9ETyBNYWtlIHRoaXMgc2ltcGxlciwgdG9vIG11Y2gganVnZ2xpbmcuXG4gICAgLy8gdGhpcy4kLmRhdFNpdGVzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAvLyB0aGlzLiQucGVlcmFnZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgLy8gdGhpcy4kLnZpZXcuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbiAgICAvLyB0aGlzLiQudmlldy5zdHlsZS5iYWNrZ3JvdW5kID0gYHdoaXRlYFxuXG4gICAgLy8gUmVtb3ZlIGZvY3VzIGZyb20gYWRkcmVzcyBiYXIuXG4gICAgYWRkcmVzc0lucHV0LmJsdXIoKVxuICAgIC8vIFNhdmUgdGhpcyBhZGRyZXNzIGludG8gaGlzdG9yeS5cbiAgICBjb25zdCBkYXRTaXRlcyA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdkYXRTaXRlcycpXG4gICAgaWYgKGRhdFNpdGVzKSB7XG4gICAgICAgIGNvbnN0IGRhdFNpdGVJdGVtcyA9IEpTT04ucGFyc2UoZGF0U2l0ZXMpXG4gICAgICAgIGxldCBoYXNBZGRyZXNzID0gZmFsc2VcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdFNpdGVJdGVtcykge1xuICAgICAgICAgICAgaWYgKGRhdFNpdGVJdGVtcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coa2V5ICsgXCIgLT4gXCIgKyBKU09OLnN0cmluZ2lmeShkYXRTaXRlSXRlbXNba2V5XSkpO1xuICAgICAgICAgICAgICAgIGlmIChkYXRTaXRlSXRlbXNba2V5XS5hZGRyZXNzID09PSBhZGRyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc0FkZHJlc3MgPSB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaGFzQWRkcmVzcykge1xuICAgICAgICAgICAgZGF0U2l0ZUl0ZW1zLnVuc2hpZnQoeyBhZGRyZXNzOiBhZGRyZXNzIH0pXG4gICAgICAgICAgICAvLyB0aGlzLiQuZGF0U2l0ZXMuaXRlbXMgPSBkYXRTaXRlSXRlbXNcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdkYXRTaXRlcycsIEpTT04uc3RyaW5naWZ5KGRhdFNpdGVJdGVtcykpXG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZGF0U2l0ZXMnLCBgW3tcImFkZHJlc3NcIjogXCIke2FkZHJlc3N9XCJ9XWApXG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoZSB0YXJnZXQgdXNlcyBEYXQgcHJvdG9jb2wsIG90aGVyd2lzZSBpdCdzIHNvbWV0aGluZyB3ZWlyZCBsaWtlIGh0dHAgOykuXG4gICAgbGV0IHRhcmdldFVybCA9ICcnXG4gICAgaWYgKGFkZHJlc3Muc3Vic3RyKDAsNCkgPT09ICdkYXQ6Jykge1xuICAgICAgICAvLyBSZW1vdmUgcHJvdG9jb2wgYW5kIGFsbCBzbGFzaGVzIHRvIGJlIHVzZWQgaW4gZ2F0ZXdheSBhZGRyZXNzLlxuICAgICAgICBsZXQgZ2F0ZXdheVRhcmdldCA9IGFkZHJlc3MucmVwbGFjZSgnZGF0Oi8vJywgJycpLnJlcGxhY2UoJy8nLCAnJylcbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBiYXNlMzIgb2YgYnVuc2VuLmhhc2hiYXNlLmlvIGlmIHRoZSBzdWJkb21haW4gaXMgYmFzZTMyIGxlbmd0aCwgb3RoZXJ3aXNlIHdlJ3JlXG4gICAgICAgIC8vIHByb2JiYWx5IG5vdCBydW5uaW5nIGluIGEgZ2F0ZXdheSB3aXRoIGJhc2UzMiBzdWJkb21haW4gc3VwcG9ydC5cbiAgICAgICAgbGV0IGdhdGV3YXlQYXJ0cyA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0LnNwbGl0KCcuJylcbiAgICAgICAgaWYgKGdhdGV3YXlQYXJ0c1swXS5sZW5ndGggPT09IDUyKSB7XG4gICAgICAgICAgICBnYXRld2F5UGFydHMuc2hpZnQoKVxuICAgICAgICB9XG4gICAgICAgIGxldCBnYXRld2F5Um9vdCA9IGdhdGV3YXlQYXJ0cy5qb2luKCcuJylcbiAgICAgICAgLy8gdGFyZ2V0VXJsID0gYCR7d2luZG93LmxvY2F0aW9uLnByb3RvY29sfS8vJHtnYXRld2F5Um9vdH0vJHtnYXRld2F5VGFyZ2V0fS9gXG4gICAgICAgIHRhcmdldFVybCA9IGAke3dpbmRvdy5sb2NhdGlvbi5wcm90b2NvbH0vL2xvY2FsaG9zdDozMDAwLyR7Z2F0ZXdheVRhcmdldH0vYFxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldFVybCA9IGFkZHJlc3NcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJvcGVuaW5nIHRhcmdldFVybDogXCIgKyB0YXJnZXRVcmwpXG4gICAgaWZyYW1lLnNyYyA9IHRhcmdldFVybFxufVxuXG5hc3luYyBmdW5jdGlvbiByZWZyZXNoKCkge1xuICAgIG9wZW5BZGRyZXNzKGN1cnJlbnRBZGRyZXNzKVxufVxuXG5hc3luYyBmdW5jdGlvbiBoYXNoSGFzQ2hhbmdlZCgpIHtcbiAgICBsZXQgYWRkcmVzc0lucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhZGRyZXNzXCIpO1xuICAgIGxldCBhZGRyZXNzID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyKDEsIHdpbmRvdy5sb2NhdGlvbi5oYXNoLmxlbmd0aClcbiAgICBhZGRyZXNzSW5wdXQudmFsdWUgPSBhZGRyZXNzXG4gICAgb3BlbkFkZHJlc3MoYWRkcmVzcylcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2xlYXJBZGRyZXNzKCkge1xuICAgIGxldCBhZGRyZXNzSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2FkZHJlc3NcIik7XG4gICAgYWRkcmVzc0lucHV0LnZhbHVlID0gJydcbiAgICAvLyBGb2N1cyBiYWNrIGFmdGVyIDIwMCBtaWxsaXNlY29uZHMuIERlbGF5IGlzIGEgcXVpcmsgb2YgYW5pbWF0aW9ucyBpbiBwYXBlci1pbnB1dC5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgYWRkcmVzc0lucHV0LmZvY3VzKClcbiAgICAgICAgc2hvd0RhdFNpdGVzKClcbiAgICB9LCAyMDApXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNob3dEYXRTaXRlcygpIHtcbiAgICBsZXQgYWRkcmVzc0lucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhZGRyZXNzXCIpO1xuICAgIGxldCBkYXRMaXN0aW5nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNkYXRMaXN0aW5nXCIpO1xuICAgIGxldCBpZnJhbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpZXdcIik7XG4gICAgY29uc3QgZGF0U2l0ZXMgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZGF0U2l0ZXMnKVxuICAgIGlmIChkYXRTaXRlcykge1xuICAgICAgICBjb25zdCBkYXRTaXRlSXRlbXMgPSBKU09OLnBhcnNlKGRhdFNpdGVzKVxuICAgICAgICBjb25zdCB0bXBsID0gZGF0cyA9PiBgXG4gICAgICAgICAgICA8dGFibGU+XG4gICAgICAgICAgICAke2RhdHMubWFwKGRhdCA9PiBgXG4gICAgICAgICAgICAgICAgPHRyPjx0ZD48YSBocmVmPVwiJHtkYXQuYWRkcmVzc31cIj4ke2RhdC5hZGRyZXNzfTwvYT48L3RkPjwvdHI+XG4gICAgICAgICAgICBgKS5qb2luKCcnKX1cbiAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgIGA7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRtcGwoZGF0U2l0ZUl0ZW1zKSk7XG4gICAgICAgIGRhdExpc3RpbmcuaW5uZXJIVE1MID0gdG1wbChkYXRTaXRlSXRlbXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdkYXRTaXRlcycsICdbXScpXG4gICAgfVxuICAgIGFkZHJlc3NJbnB1dC5pc0ZvY3VzZWQgPSB0cnVlXG4gICAgaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICBkYXRMaXN0aW5nLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgLy8gdGhpcy4kLnBlZXJhZ2Uuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbn1cblxuYXN5bmMgZnVuY3Rpb24gb3BlbkRhdCAoKSB7XG4gICAgY29uc3QgYWRkcmVzc0JveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRyZXNzJylcbiAgICBjb25zdCB1cmwgPSBhZGRyZXNzQm94LnZhbHVlXG4gICAgY29uc29sZS5sb2coJ29wZW5pbmcgJyArIHVybClcbiAgICBjb25zdCBmcmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3JylcbiAgICAvLyBmcmFtZS5wYXJlbnQuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZShkYXRBZGRyZXNzLCAnKicpXG4gICAgLy8gaWZyYW1lLnNyYyA9IHRoaXMuc2VydmVyVXJsICsgdGhpcy5idW5zZW5BZGRyZXNzICsgXCIjXCIgKyBkYXRVcmlcbiAgICBsZXQgZ2F0ZXdheVRhcmdldCA9IHVybC5yZXBsYWNlKCdkYXQ6Ly8nLCAnJykucmVwbGFjZSgnLycsICcnKVxuICAgIC8vIFJlbW92ZSB0aGUgYmFzZTMyIG9mIGJ1bnNlbi5oYXNoYmFzZS5pbyBpZiB0aGUgc3ViZG9tYWluIGlzIGJhc2UzMiBsZW5ndGgsIG90aGVyd2lzZSB3ZSdyZVxuICAgIC8vIHByb2JiYWx5IG5vdCBydW5uaW5nIGluIGEgZ2F0ZXdheSB3aXRoIGJhc2UzMiBzdWJkb21haW4gc3VwcG9ydC5cbiAgICBsZXQgZ2F0ZXdheVBhcnRzID0gd2luZG93LmxvY2F0aW9uLmhvc3Quc3BsaXQoJy4nKVxuICAgIGlmIChnYXRld2F5UGFydHNbMF0ubGVuZ3RoID09PSA1Mikge1xuICAgICAgICBnYXRld2F5UGFydHMuc2hpZnQoKVxuICAgIH1cbiAgICBsZXQgZ2F0ZXdheVJvb3QgPSBnYXRld2F5UGFydHMuam9pbignLicpXG4gICAgLy8gdGFyZ2V0VXJsID0gYCR7d2luZG93LmxvY2F0aW9uLnByb3RvY29sfS8vJHtnYXRld2F5Um9vdH0vJHtnYXRld2F5VGFyZ2V0fS9gXG4gICAgdGFyZ2V0VXJsID0gYCR7d2luZG93LmxvY2F0aW9uLnByb3RvY29sfS8vbG9jYWxob3N0OjMwMDAvJHtnYXRld2F5VGFyZ2V0fS9gXG4gICAgLy8gZnJhbWUuc3JjID0gdGFyZ2V0VXJsXG4gICAgLy8gZnJhbWUuc3JjID0gXCJodHRwOi8vbG9jYWxob3N0OjMwMDAvNWYxYTk3ZmZkNTA4MWIxNTFjZDg1OTQwZTM3OTdjZGVjODI3MDBmNzI0ZmRhOTgxYzRlOWM3YTViMjljMzM1YS9cIlxuICAgIGZyYW1lLnNyYyA9IFwiaHR0cDovL2J3ZDlmenluMTBkaGE3NnJiNTBlNnlid3Z2NDJlMDdxNGt5dWswZTR4NzN1YmNtdzZkZDAubG9jYWxob3N0OjMwMDAvXCJcbn1cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCByZWNlaXZlTWVzc2FnZSwgZmFsc2UpXG4iLCJ2YXIgaXNhcnJheSA9IHJlcXVpcmUoJ2lzYXJyYXknKTtcbnZhciBoYXNmID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbmZ1bmN0aW9uIGhhcyAob2JqLCBrZXkpIHsgcmV0dXJuIGhhc2YuY2FsbChvYmosa2V5KSB9XG5cbnZhciBWRVJTSU9OID0gJzEuMC4wJztcblxubW9kdWxlLmV4cG9ydHMgPSBSUEM7XG5cbmZ1bmN0aW9uIFJQQyAoc3JjLCBkc3QsIG9yaWdpbiwgbWV0aG9kcykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSUEMpKSByZXR1cm4gbmV3IFJQQyhzcmMsIGRzdCwgb3JpZ2luLCBtZXRob2RzKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5zcmMgPSBzcmM7XG4gICAgdGhpcy5kc3QgPSBkc3Q7XG4gICAgdGhpcy5fZHN0SXNXb3JrZXIgPSAvV29ya2VyLy50ZXN0KGRzdCk7XG4gICAgXG4gICAgaWYgKG9yaWdpbiA9PT0gJyonKSB7XG4gICAgICAgIHRoaXMub3JpZ2luID0gJyonO1xuICAgIH1cbiAgICBlbHNlIGlmIChvcmlnaW4pIHtcbiAgICAgICAgdmFyIHVvcmlnaW4gPSBuZXcgVVJMKG9yaWdpbik7XG4gICAgICAgIHRoaXMub3JpZ2luID0gdW9yaWdpbi5wcm90b2NvbCArICcvLycgKyB1b3JpZ2luLmhvc3Q7XG4gICAgfVxuICAgIFxuICAgIHRoaXMuX3NlcXVlbmNlID0gMDtcbiAgICB0aGlzLl9jYWxsYmFja3MgPSB7fTtcbiAgICBcbiAgICB0aGlzLl9vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgaWYgKHNlbGYuX2Rlc3Ryb3llZCkgcmV0dXJuO1xuICAgICAgICBpZiAoc2VsZi5vcmlnaW4gIT09ICcqJyAmJiBldi5vcmlnaW4gIT09IHNlbGYub3JpZ2luKSByZXR1cm47XG4gICAgICAgIGlmICghZXYuZGF0YSB8fCB0eXBlb2YgZXYuZGF0YSAhPT0gJ29iamVjdCcpIHJldHVybjtcbiAgICAgICAgaWYgKGV2LmRhdGEucHJvdG9jb2wgIT09ICdmcmFtZS1ycGMnKSByZXR1cm47XG4gICAgICAgIGlmICghaXNhcnJheShldi5kYXRhLmFyZ3VtZW50cykpIHJldHVybjtcbiAgICAgICAgc2VsZi5faGFuZGxlKGV2LmRhdGEpO1xuICAgIH07XG4gICAgdGhpcy5zcmMuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMuX29ubWVzc2FnZSk7XG4gICAgdGhpcy5fbWV0aG9kcyA9ICh0eXBlb2YgbWV0aG9kcyA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICA/IG1ldGhvZHModGhpcylcbiAgICAgICAgOiBtZXRob2RzXG4gICAgKSB8fCB7fTtcbn1cblxuUlBDLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG4gICAgdGhpcy5zcmMucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMuX29ubWVzc2FnZSk7XG59O1xuXG5SUEMucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIHRoaXMuYXBwbHkobWV0aG9kLCBhcmdzKTtcbn07XG5cblJQQy5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbiAobWV0aG9kLCBhcmdzKSB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkgcmV0dXJuO1xuICAgIHZhciBzZXEgPSB0aGlzLl9zZXF1ZW5jZSArKztcbiAgICBpZiAodHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLl9jYWxsYmFja3Nbc2VxXSA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgYXJncyA9IGFyZ3Muc2xpY2UoMCwgLTEpO1xuICAgIH1cbiAgICB0aGlzLl9kc3RQb3N0TWVzc2FnZSh7XG4gICAgICAgIHByb3RvY29sOiAnZnJhbWUtcnBjJyxcbiAgICAgICAgdmVyc2lvbjogVkVSU0lPTixcbiAgICAgICAgc2VxdWVuY2U6IHNlcSxcbiAgICAgICAgbWV0aG9kOiBtZXRob2QsIFxuICAgICAgICBhcmd1bWVudHM6IGFyZ3NcbiAgICB9KTtcbn07XG5cblJQQy5wcm90b3R5cGUuX2RzdFBvc3RNZXNzYWdlID0gZnVuY3Rpb24gKG1zZykge1xuICAgIGlmICh0aGlzLl9kc3RJc1dvcmtlcikge1xuICAgICAgICB0aGlzLmRzdC5wb3N0TWVzc2FnZShtc2cpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5kc3QucG9zdE1lc3NhZ2UobXNnLCB0aGlzLm9yaWdpbik7XG4gICAgfVxufTtcblxuUlBDLnByb3RvdHlwZS5faGFuZGxlID0gZnVuY3Rpb24gKG1zZykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoc2VsZi5fZGVzdHJveWVkKSByZXR1cm47XG4gICAgaWYgKGhhcyhtc2csICdtZXRob2QnKSkge1xuICAgICAgICBpZiAoIWhhcyh0aGlzLl9tZXRob2RzLCBtc2cubWV0aG9kKSkgcmV0dXJuO1xuICAgICAgICB2YXIgYXJncyA9IG1zZy5hcmd1bWVudHMuY29uY2F0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuX2RzdFBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICBwcm90b2NvbDogJ2ZyYW1lLXJwYycsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogVkVSU0lPTixcbiAgICAgICAgICAgICAgICByZXNwb25zZTogbXNnLnNlcXVlbmNlLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW10uc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX21ldGhvZHNbbXNnLm1ldGhvZF0uYXBwbHkodGhpcy5fbWV0aG9kcywgYXJncyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGhhcyhtc2csICdyZXNwb25zZScpKSB7XG4gICAgICAgIHZhciBjYiA9IHRoaXMuX2NhbGxiYWNrc1ttc2cucmVzcG9uc2VdO1xuICAgICAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzW21zZy5yZXNwb25zZV07XG4gICAgICAgIGlmIChjYikgY2IuYXBwbHkobnVsbCwgbXNnLmFyZ3VtZW50cyk7XG4gICAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXJyKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIiJdfQ==
