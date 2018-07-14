var RPC = require('frame-rpc');
const serverUrl = 'http://localhost:3000/';

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
    const url = searchBox.value
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
        frame.src = targetUrl;
        // frame.contentWindow.Bunsen = archive
    } catch (e) {
        alert('Error: ' + e)
        console.log('Error: ' + e)
    }
}

window.addEventListener('message', receiveMessage, false)
