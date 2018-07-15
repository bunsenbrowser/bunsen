(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.RCPme = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// var RPC = require('frame-rpc');
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

},{}],"graceful-fs":[function(require,module,exports){

},{}]},{},[1])("graceful-fs")
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvaW5kZXguanMiLCJmcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6T0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLyB2YXIgUlBDID0gcmVxdWlyZSgnZnJhbWUtcnBjJyk7XG5jb25zdCBzZXJ2ZXJVcmwgPSAnaHR0cDovL2xvY2FsaG9zdDozMDAwLyc7XG5cbmNvbnN0IGJ1bnNlbkFkZHJlc3MgPSBcImRhdDovL2hvbWUtYnVuc2VuLmhhc2hiYXNlLmlvL1wiXG4vLyBjb25zdCBidW5zZW5BZGRyZXNzID0gXCJkYXQ6Ly9mb3JrLXVpMi1idW5zZW4uaGFzaGJhc2UuaW8vXCJcbi8vIGNvbnN0IHdpa2lBZGRyZXNzID0gXCJkYXQ6Ly93eXNpd3l3aWtpLWJ1bnNlbi5oYXNoYmFzZS5pby9cIlxuY29uc3Qgd2lraUFkZHJlc3MgPSBcImRhdDovLzUyODY5MTkwNTg2NjExMmM5MGVlYTk0OWJjYzA3MTJjMjA4ZjBhYzA4MDNkMzgzMTJkYzE4Y2ZhN2ZkYTgyZDEvXCJcbmxldCBjdXJyZW50QWRkcmVzcyA9IFwiXCJcblxuYXN5bmMgZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UgKGV2ZW50KSB7XG4vLyBjb25zb2xlLmxvZyhldmVudC5kYXRhKVxuICBsZXQgZGF0YSA9IGV2ZW50LmRhdGFcbiAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJyAmJiBkYXRhLnN0YXJ0c1dpdGgoJ2RhdDonKSkge1xuICAgIGxldCBkYXRBZGRyZXNzID0gZGF0YVxuICAgIHRyeSB7XG4gICAgICBsZXQgZm9ya2VkQXJjaGl2ZSA9IGF3YWl0IERhdEFyY2hpdmUuZm9yayhkYXRBZGRyZXNzKVxuICAgICAgY29uc29sZS5sb2coJ3dlIGZvcmtlZCB0bycsIGZvcmtlZEFyY2hpdmUudXJsKVxuICAgICAgLy8gbGV0IHRoZUFyY2hpdmUgPSBhd2FpdCBEYXRBcmNoaXZlLnNlbGVjdEFyY2hpdmUoe30pXG4gICAgICBjb25zb2xlLmxvZygnaGV5IScpXG4gICAgICBwYXJlbnQubG9jYXRpb24ucmVsb2FkKClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3I6ICcgKyBlKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAodHlwZW9mIGRhdGEuYXJndW1lbnRzICE9PSAndW5kZWZpbmVkJyAmJiBkYXRhLmFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICBsZXQgdXJsID0gZGF0YS5hcmd1bWVudHNbMV1cbiAgICAgIGlmICh0eXBlb2YgdXJsID09PSAnc3RyaW5nJyAmJiB1cmwuc3RhcnRzV2l0aCgnZGF0OicpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdkYXQ6ICcgKyB1cmwpXG4gICAgICAgIC8vIGxldCBhcmNoaXZlID0gYXdhaXQgbmV3IERhdEFyY2hpdmUodXJsKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgYXN5bmMgKGV2ZW50KSA9PiB7XG4gIGNvbnNvbGUubG9nKCdET01Db250ZW50TG9hZGVkIGluIGNsaWVudCcpXG4gICAgY29uc3QgYWRkcmVzc0JveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRyZXNzJylcbiAgICBhZGRyZXNzQm94LnZhbHVlID0gYnVuc2VuQWRkcmVzc1xuICAgIGNvbnN0IG9wZW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3BlbicpXG4gICAgb3BlbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHJlZnJlc2gpXG4gICAgY29uc3Qgc2l0ZXNCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2l0ZXMnKVxuICAgIHNpdGVzQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xlYXJBZGRyZXNzKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgKCkgPT4gaGFzaEhhc0NoYW5nZWQoKSlcbiAgICAvLyBIYW5kbGUgZm9jdXMgb24gZGF0IHVybCBpbnB1dC5cbiAgICBhZGRyZXNzQm94LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzaW4nLCAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZm9jdXNpblwiKVxuICAgICAgICBzaG93RGF0U2l0ZXMoKTtcbiAgICB9KVxuICAgIC8vIFJlbW92ZSBzcGFjZXMgdGhhdCBrZXlib2FyZHMgYWRkIGFmdGVyIGAuYCBjaGFyYWN0ZXIuXG4gICAgYWRkcmVzc0JveC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC50YXJnZXQudmFsdWUgPSBldmVudC50YXJnZXQudmFsdWUucmVwbGFjZSgnICcsICcnKVxuICAgIH0pXG5cbiAgICAvLyBMaXN0ZW4gZm9yIHN1Ym1pdCBvZiBuZXcgVVJMLlxuICAgIGFkZHJlc3NCb3guYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgIT09IDEzKSByZXR1cm5cbiAgICAgICAgdGhpcy5vcGVuQWRkcmVzcyhhZGRyZXNzQm94LnZhbHVlKVxuICAgIH0pXG5cbiAgICAvLyBGaXQgaWZyYW1lIHRvIHdpbmRvdy5cbiAgICBjb25zdCBmcmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWV3JylcbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIHZpZXcuc3R5bGUuaGVpZ2h0ID0gYCR7d2luZG93LmlubmVySGVpZ2h0IC0gNDd9cHhgXG4gICAgfSwgNTAwKVxuXG4gICAgLy8gQWRqdXN0bWVudHMgZm9yIGJyb3dzZXJzIHRoYXQgYXJlIG5vdCBCdW5zZW4uXG4gICAgaWYgKCFuYXZpZ2F0b3IudXNlckFnZW50LmluY2x1ZGVzKCdCdW5zZW5Ccm93c2VyJykpIHtcbiAgICAgICAgLy8gQWxlcnQgZm9sa3Mgd2hvIGFyZSBub3QgdXNpbmcgQnVuc2VuLlxuICAgICAgICBpZiAoIWxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzdXBwcmVzc0luc3RhbGxCYW5uZXInKSkge1xuICAgICAgICAgICAgLy8gQFRPRE8gU2hvdyBhIGhpZGUgYnV0dG9uIHRvIHNldCB0aGlzIHRvIGZhbHNlLlxuICAgICAgICAgICAgLy90aGlzLnNob3dJbnN0YWxsQmFubmVyID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBSZWdpc3RlciB0byBoYW5kbGUgZGF0Oi8vIGxpbmtzLlxuICAgICAgICAgICAgbmF2aWdhdG9yLnJlZ2lzdGVyUHJvdG9jb2xIYW5kbGVyKFwiZGF0XCIsXG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uKyc/dXJpPSVzJyxcbiAgICAgICAgICAgICAgICBcIkJ1bnNlbiBCcm93c2VyXCIpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vIFRyYW5zZm9ybSBkYXQ6Ly8gQW5jaG9yIHRhZ3MgdG8gcG9pbnQgYXQgZ2F0ZXdheS5cbiAgICAgICAgICAgIC8vIEBUT0RPIFJlbW92ZSBtZSBvciBjaGVjayBmb3Igbm9uLXN1YmRvbWFpbiBzdXBwb3J0ZWQgZ2F0ZXdheS4gTm8gbG9uZ2VyIHBvc3NpYmxlIGJlY2F1c2UgZGF0IHNpdGVzIGFyZSBvbiBzZXBlcmF0ZSBzdWJkb21haW5zLlxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy4kLnZpZXcuY29udGVudERvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2EnKS5mb3JFYWNoKGFuY2hvckVsID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgaHJlZiA9IGFuY2hvckVsLmdldEF0dHJpYnV0ZSgnaHJlZicpXG4gICAgICAgICAgICAgICAgaWYgKGhyZWYgJiYgaHJlZi5zdWJzdHIoMCw2KSA9PT0gJ2RhdDovLycpIHtcbiAgICAgICAgICAgICAgICAgIGFuY2hvckVsLnNldEF0dHJpYnV0ZSgnaHJlZicsIGAke3RoaXMuZ2F0ZXdheX0vJHtocmVmLnN1YnN0cig2LCBocmVmLmxlbmd0aCl9L2ApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCA1MDApXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgKi9cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLy8gT3BlbiBhbiBhZGRyZXNzIHRvIGdldCBzdGFydGVkLlxuICAgIC8vIERldGVjdCBjYXNlIG9mIEZpcmVmb3ggcmVnaXN0ZXJlZCBwcm90b2NvbCBoYW5kbGluZy5cbiAgICBpZiAod2luZG93LmxvY2F0aW9uLnNlYXJjaC5pbmNsdWRlcygnP3VyaT0nKSkge1xuICAgICAgICBsZXQgZnJhZyA9IGRlY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24uc2VhcmNoKVxuICAgICAgICBsZXQgZGF0QWRkcmVzcyA9IGZyYWcuc3Vic3RyKDUsIGZyYWcubGVuZ3RoKVxuICAgICAgICB0aGlzLm9wZW5BZGRyZXNzKGRhdEFkZHJlc3MpXG4gICAgfSBlbHNlIGlmICh3aW5kb3cubG9jYXRpb24uaGFzaCAhPT0gJycpIHtcbiAgICAgICAgaGFzaEhhc0NoYW5nZWQoKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIG9wZW5BZGRyZXNzKCdkYXQ6Ly9ob21lLWJ1bnNlbi5oYXNoYmFzZS5pbycpXG4gICAgfVxufSlcblxuYXN5bmMgZnVuY3Rpb24gb3BlbkFkZHJlc3MoYWRkcmVzcykge1xuICAgIGN1cnJlbnRBZGRyZXNzID0gYWRkcmVzc1xuICAgIGxldCBhZGRyZXNzSW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2FkZHJlc3NcIik7XG4gICAgbGV0IGRhdExpc3RpbmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2RhdExpc3RpbmdcIik7XG4gICAgbGV0IGlmcmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmlld1wiKTtcbiAgICBhZGRyZXNzSW5wdXQudmFsdWUgPSBhZGRyZXNzXG5cbiAgICAvLyBTaG93IHNvbWUgc3R1ZmYsIGhpZGUgc29tZSBzdHVmZi4gQFRPRE8gTWFrZSB0aGlzIHNpbXBsZXIsIHRvbyBtdWNoIGp1Z2dsaW5nLlxuICAgIC8vIHRoaXMuJC5kYXRTaXRlcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgLy8gdGhpcy4kLnBlZXJhZ2Uuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgIC8vIHRoaXMuJC52aWV3LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgLy8gdGhpcy4kLnZpZXcuc3R5bGUuYmFja2dyb3VuZCA9IGB3aGl0ZWBcblxuICAgIC8vIFJlbW92ZSBmb2N1cyBmcm9tIGFkZHJlc3MgYmFyLlxuICAgIGFkZHJlc3NJbnB1dC5ibHVyKClcbiAgICAvLyBTYXZlIHRoaXMgYWRkcmVzcyBpbnRvIGhpc3RvcnkuXG4gICAgY29uc3QgZGF0U2l0ZXMgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZGF0U2l0ZXMnKVxuICAgIGlmIChkYXRTaXRlcykge1xuICAgICAgICBjb25zdCBkYXRTaXRlSXRlbXMgPSBKU09OLnBhcnNlKGRhdFNpdGVzKVxuICAgICAgICBsZXQgaGFzQWRkcmVzcyA9IGZhbHNlXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRTaXRlSXRlbXMpIHtcbiAgICAgICAgICAgIGlmIChkYXRTaXRlSXRlbXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGtleSArIFwiIC0+IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0U2l0ZUl0ZW1zW2tleV0pKTtcbiAgICAgICAgICAgICAgICBpZiAoZGF0U2l0ZUl0ZW1zW2tleV0uYWRkcmVzcyA9PT0gYWRkcmVzcykge1xuICAgICAgICAgICAgICAgICAgICBoYXNBZGRyZXNzID0gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWhhc0FkZHJlc3MpIHtcbiAgICAgICAgICAgIGRhdFNpdGVJdGVtcy51bnNoaWZ0KHsgYWRkcmVzczogYWRkcmVzcyB9KVxuICAgICAgICAgICAgLy8gdGhpcy4kLmRhdFNpdGVzLml0ZW1zID0gZGF0U2l0ZUl0ZW1zXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZGF0U2l0ZXMnLCBKU09OLnN0cmluZ2lmeShkYXRTaXRlSXRlbXMpKVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2RhdFNpdGVzJywgYFt7XCJhZGRyZXNzXCI6IFwiJHthZGRyZXNzfVwifV1gKVxuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGUgdGFyZ2V0IHVzZXMgRGF0IHByb3RvY29sLCBvdGhlcndpc2UgaXQncyBzb21ldGhpbmcgd2VpcmQgbGlrZSBodHRwIDspLlxuICAgIGxldCB0YXJnZXRVcmwgPSAnJ1xuICAgIGlmIChhZGRyZXNzLnN1YnN0cigwLDQpID09PSAnZGF0OicpIHtcbiAgICAgICAgLy8gUmVtb3ZlIHByb3RvY29sIGFuZCBhbGwgc2xhc2hlcyB0byBiZSB1c2VkIGluIGdhdGV3YXkgYWRkcmVzcy5cbiAgICAgICAgbGV0IGdhdGV3YXlUYXJnZXQgPSBhZGRyZXNzLnJlcGxhY2UoJ2RhdDovLycsICcnKS5yZXBsYWNlKCcvJywgJycpXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgYmFzZTMyIG9mIGJ1bnNlbi5oYXNoYmFzZS5pbyBpZiB0aGUgc3ViZG9tYWluIGlzIGJhc2UzMiBsZW5ndGgsIG90aGVyd2lzZSB3ZSdyZVxuICAgICAgICAvLyBwcm9iYmFseSBub3QgcnVubmluZyBpbiBhIGdhdGV3YXkgd2l0aCBiYXNlMzIgc3ViZG9tYWluIHN1cHBvcnQuXG4gICAgICAgIGxldCBnYXRld2F5UGFydHMgPSB3aW5kb3cubG9jYXRpb24uaG9zdC5zcGxpdCgnLicpXG4gICAgICAgIGlmIChnYXRld2F5UGFydHNbMF0ubGVuZ3RoID09PSA1Mikge1xuICAgICAgICAgICAgZ2F0ZXdheVBhcnRzLnNoaWZ0KClcbiAgICAgICAgfVxuICAgICAgICBsZXQgZ2F0ZXdheVJvb3QgPSBnYXRld2F5UGFydHMuam9pbignLicpXG4gICAgICAgIC8vIHRhcmdldFVybCA9IGAke3dpbmRvdy5sb2NhdGlvbi5wcm90b2NvbH0vLyR7Z2F0ZXdheVJvb3R9LyR7Z2F0ZXdheVRhcmdldH0vYFxuICAgICAgICB0YXJnZXRVcmwgPSBgJHt3aW5kb3cubG9jYXRpb24ucHJvdG9jb2x9Ly9sb2NhbGhvc3Q6MzAwMC8ke2dhdGV3YXlUYXJnZXR9L2BcbiAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXRVcmwgPSBhZGRyZXNzXG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFwib3BlbmluZyB0YXJnZXRVcmw6IFwiICsgdGFyZ2V0VXJsKVxuICAgIGlmcmFtZS5zcmMgPSB0YXJnZXRVcmxcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVmcmVzaCgpIHtcbiAgICBvcGVuQWRkcmVzcyhjdXJyZW50QWRkcmVzcylcbn1cblxuYXN5bmMgZnVuY3Rpb24gaGFzaEhhc0NoYW5nZWQoKSB7XG4gICAgbGV0IGFkZHJlc3NJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYWRkcmVzc1wiKTtcbiAgICBsZXQgYWRkcmVzcyA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxLCB3aW5kb3cubG9jYXRpb24uaGFzaC5sZW5ndGgpXG4gICAgYWRkcmVzc0lucHV0LnZhbHVlID0gYWRkcmVzc1xuICAgIG9wZW5BZGRyZXNzKGFkZHJlc3MpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNsZWFyQWRkcmVzcygpIHtcbiAgICBsZXQgYWRkcmVzc0lucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhZGRyZXNzXCIpO1xuICAgIGFkZHJlc3NJbnB1dC52YWx1ZSA9ICcnXG4gICAgLy8gRm9jdXMgYmFjayBhZnRlciAyMDAgbWlsbGlzZWNvbmRzLiBEZWxheSBpcyBhIHF1aXJrIG9mIGFuaW1hdGlvbnMgaW4gcGFwZXItaW5wdXQuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGFkZHJlc3NJbnB1dC5mb2N1cygpXG4gICAgICAgIHNob3dEYXRTaXRlcygpXG4gICAgfSwgMjAwKVxufVxuXG5hc3luYyBmdW5jdGlvbiBzaG93RGF0U2l0ZXMoKSB7XG4gICAgbGV0IGFkZHJlc3NJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYWRkcmVzc1wiKTtcbiAgICBsZXQgZGF0TGlzdGluZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZGF0TGlzdGluZ1wiKTtcbiAgICBsZXQgaWZyYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWV3XCIpO1xuICAgIGNvbnN0IGRhdFNpdGVzID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2RhdFNpdGVzJylcbiAgICBpZiAoZGF0U2l0ZXMpIHtcbiAgICAgICAgY29uc3QgZGF0U2l0ZUl0ZW1zID0gSlNPTi5wYXJzZShkYXRTaXRlcylcbiAgICAgICAgY29uc3QgdG1wbCA9IGRhdHMgPT4gYFxuICAgICAgICAgICAgPHRhYmxlPlxuICAgICAgICAgICAgJHtkYXRzLm1hcChkYXQgPT4gYFxuICAgICAgICAgICAgICAgIDx0cj48dGQ+PGEgaHJlZj1cIiR7ZGF0LmFkZHJlc3N9XCI+JHtkYXQuYWRkcmVzc308L2E+PC90ZD48L3RyPlxuICAgICAgICAgICAgYCkuam9pbignJyl9XG4gICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICBgO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyh0bXBsKGRhdFNpdGVJdGVtcykpO1xuICAgICAgICBkYXRMaXN0aW5nLmlubmVySFRNTCA9IHRtcGwoZGF0U2l0ZUl0ZW1zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZGF0U2l0ZXMnLCAnW10nKVxuICAgIH1cbiAgICBhZGRyZXNzSW5wdXQuaXNGb2N1c2VkID0gdHJ1ZVxuICAgIGlmcmFtZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgZGF0TGlzdGluZy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgIC8vIHRoaXMuJC5wZWVyYWdlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9wZW5EYXQgKCkge1xuICAgIGNvbnN0IGFkZHJlc3NCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkcmVzcycpXG4gICAgY29uc3QgdXJsID0gYWRkcmVzc0JveC52YWx1ZVxuICAgIGNvbnNvbGUubG9nKCdvcGVuaW5nICcgKyB1cmwpXG4gICAgY29uc3QgZnJhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndmlldycpXG4gICAgLy8gZnJhbWUucGFyZW50LmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoZGF0QWRkcmVzcywgJyonKVxuICAgIC8vIGlmcmFtZS5zcmMgPSB0aGlzLnNlcnZlclVybCArIHRoaXMuYnVuc2VuQWRkcmVzcyArIFwiI1wiICsgZGF0VXJpXG4gICAgbGV0IGdhdGV3YXlUYXJnZXQgPSB1cmwucmVwbGFjZSgnZGF0Oi8vJywgJycpLnJlcGxhY2UoJy8nLCAnJylcbiAgICAvLyBSZW1vdmUgdGhlIGJhc2UzMiBvZiBidW5zZW4uaGFzaGJhc2UuaW8gaWYgdGhlIHN1YmRvbWFpbiBpcyBiYXNlMzIgbGVuZ3RoLCBvdGhlcndpc2Ugd2UncmVcbiAgICAvLyBwcm9iYmFseSBub3QgcnVubmluZyBpbiBhIGdhdGV3YXkgd2l0aCBiYXNlMzIgc3ViZG9tYWluIHN1cHBvcnQuXG4gICAgbGV0IGdhdGV3YXlQYXJ0cyA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0LnNwbGl0KCcuJylcbiAgICBpZiAoZ2F0ZXdheVBhcnRzWzBdLmxlbmd0aCA9PT0gNTIpIHtcbiAgICAgICAgZ2F0ZXdheVBhcnRzLnNoaWZ0KClcbiAgICB9XG4gICAgbGV0IGdhdGV3YXlSb290ID0gZ2F0ZXdheVBhcnRzLmpvaW4oJy4nKVxuICAgIC8vIHRhcmdldFVybCA9IGAke3dpbmRvdy5sb2NhdGlvbi5wcm90b2NvbH0vLyR7Z2F0ZXdheVJvb3R9LyR7Z2F0ZXdheVRhcmdldH0vYFxuICAgIHRhcmdldFVybCA9IGAke3dpbmRvdy5sb2NhdGlvbi5wcm90b2NvbH0vL2xvY2FsaG9zdDozMDAwLyR7Z2F0ZXdheVRhcmdldH0vYFxuICAgIC8vIGZyYW1lLnNyYyA9IHRhcmdldFVybFxuICAgIC8vIGZyYW1lLnNyYyA9IFwiaHR0cDovL2xvY2FsaG9zdDozMDAwLzVmMWE5N2ZmZDUwODFiMTUxY2Q4NTk0MGUzNzk3Y2RlYzgyNzAwZjcyNGZkYTk4MWM0ZTljN2E1YjI5YzMzNWEvXCJcbiAgICBmcmFtZS5zcmMgPSBcImh0dHA6Ly9id2Q5Znp5bjEwZGhhNzZyYjUwZTZ5Ynd2djQyZTA3cTRreXVrMGU0eDczdWJjbXc2ZGQwLmxvY2FsaG9zdDozMDAwL1wiXG59XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKVxuIiwiIl19
