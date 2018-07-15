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
