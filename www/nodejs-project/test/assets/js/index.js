
// (function() {
//     console.log("hey")
//     document.querySelector("#createDocument").addEventListener("click", create);
// })();

document.addEventListener("DOMContentLoaded", function(event) {
    document.querySelector("#createDocument").addEventListener("click", create);
    document.querySelector("#getInfo").addEventListener("click", getInfo);
    document.querySelector("#mkdir").addEventListener("click", mkdir);
    document.querySelector("#readFile").addEventListener("click", readFile);
    document.querySelector("#stat").addEventListener("click", stat);
    document.querySelector("#watch").addEventListener("click", watch);
    document.querySelector("#writeFile").addEventListener("click", writeFile);
});

Test = {}
Test.archive = {}
async function create() {
    Test.archive = await DatArchive.create({
        title: 'Bunsen Test ',
        description: 'Testing Bunsen support of DatArchive API.'
    })
    console.log("create returned" + JSON.stringify(Test.archive))
    document.querySelector("#createDocumentResponse").innerHTML = JSON.stringify(Test.archive)
}

async function getInfo() {
    if (typeof Test.archive.getInfo === "function") {
        let getInfo = await Test.archive.getInfo()
        console.log("getInfo returned" + JSON.stringify(getInfo))
        document.querySelector("#getInfoResponse").innerHTML = JSON.stringify(getInfo)
    } else {
        alert("Create the document first pleeeze.")
    }
}


async function readFile() {
    if (typeof Test.archive.readFile === "function") {
        // let url = Test.archive.url + "/dat.json"
        let url = Test.archive.url
        let filename = "/dat.json"
        try {
            let readFile = await Test.archive.readFile(url, filename)
            console.log("readFile returned" + JSON.stringify(readFile))
            document.querySelector("#readFileResponse").innerHTML = JSON.stringify(readFile)
        } catch (e) {
            console.log("Error reading " + url + " error: " + JSON.stringify(e))
        }
    } else {
        alert("Create the document first pleeeze.")
    }
}

async function mkdir() {
    if (typeof Test.archive.mkdir === "function") {
        try {
            let dirname = "hooty"
            let mkdir = await Test.archive.mkdir(dirname)
            console.log("mkdir returned" + JSON.stringify(mkdir))
            document.querySelector("#mkdirResponse").innerHTML = "Created the directory: " + dirname
        } catch (e) {
            alert("error: " + e)
        }
    } else {
        alert("Create the document first pleeeze.")
    }
}

async function stat() {
    if (typeof Test.archive.stat === "function") {
        let stat = await Test.archive.stat("/hooty")
        console.log("stat returned" + JSON.stringify(stat))
        document.querySelector("#statResponse").innerHTML = JSON.stringify(stat)
    } else {
        alert("Create the document first pleeeze.")
    }
}

async function watch() {
    if (typeof Test.archive.watch === "function") {
        let pathSpec = '/*.txt'
        let watch = await Test.archive.watch(pathSpec)
        socket2me();
        console.log("watch returned" + JSON.stringify(watch))
        document.querySelector("#watchResponse").innerHTML = JSON.stringify(watch)
        document.querySelector("#watchUrl").innerHTML = "<a href=" + Test.archive.url + ">Look at me!</a>"
    } else {
        alert("Create the document first pleeeze.")
    }
}

async function writeFile() {
    if (typeof Test.archive.writeFile === "function") {
        // let text = "hey there!"
        let text = document.querySelector("#writeFileTextarea").value
        uuid = uuidv4();
        let filename = "hola_" + uuid + ".txt";
        let writeFile = await Test.archive.writeFile(text, filename)
        console.log("writeFile returned" + JSON.stringify(writeFile))
        document.querySelector("#writeFileResponse").innerHTML = "Created " + filename;
    } else {
        alert("Create the document first pleeeze.")
    }
}

function socket2me() {
    // const wsUrl = `ws://localhost:3000/peers`
    const wsUrl = `ws://localhost:3001/watchEvents`
    const socket = websocketStream(wsUrl, null, null)
    // var stream = ws('ws://localhost:8343')
    let that = this;
    socket.on('data', function (rawMsg) {
        console.log("got message: " + rawMsg);
        var str = String.fromCharCode.apply(null, rawMsg);
        // let msgArray = str.split(":");
        // let uuid = msgArray[0].substring(0, 6);
        let ws = document.querySelector("#watchResponse")
        // ws.innerHTML = formattedMsg;
        ws.innerHTML = str;
        // socket.destroy()
    })
    socket.write("watchin' events.");
}
