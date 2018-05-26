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
    const wikiButton = document.getElementById('go')
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

    const contents = `
        <title>Gateway Test</title>
        <p>Hello World!</p>
        `
    try {
        await archive.writeFile('sayHello.html', contents)
        console.log('Wrote sayHello.html to ' + url)
        alert('Wrote sayHello.html to ' + url)
        // change the iframe src to this url
    } catch (e) {
        alert('Error: ' + e)
        console.log('Error: ' + e)
    }
}

window.addEventListener('message', receiveMessage, false)
