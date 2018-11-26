const GATEWAY_URL = "http://localhost:3000/"
const DATARCHIVE_URL = "http://localhost:3001/"
const BASE_32_KEY_LENGTH = 52
class DatArchiveProxy {

    constructor(url) {
        this.url = url
    }

    async create(archiveInfo) {
        // let document = { title, description, type, author }
        const url = DATARCHIVE_URL + 'create'
        let response = await fetch(url,{
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin", // include, same-origin, *omit
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            redirect: "follow", // manual, *follow, error
            referrer: "no-referrer", // no-referrer, *client
            body: JSON.stringify(archiveInfo), // body data type must match "Content-Type" header
        })
        let result = await response.json();
        // return JSON.stringify(result);
        const archive = new DatArchive(null)
        const mergedArchive = Object.assign(archive, result);
        return mergedArchive;
    }

    static async load(datUrl) {
        const url = DATARCHIVE_URL + 'load'
        let response = await fetch(url, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin", // include, same-origin, *omit
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            redirect: "follow", // manual, *follow, error
            referrer: "no-referrer", // no-referrer, *client
            body: JSON.stringify({ datUrl }) // body data type must match "Content-Type" header
        })
        let result = await response.json()
        const archive = new DatArchive(null)
        return Object.assign(archive, result)
    }

    async readFile(path, options) {
        // @TODO Support for options.
        const url = this.url
        // const resource = url.replace('dat://','')
        const data = {url:url,filename: path}
        // const data = {url:url}
        const appUrl = DATARCHIVE_URL + 'readFile'
        // const appUrl = DATARCHIVE_URL
        // const appUrl = GATEWAY_URL + 'readFile'
        let response = await fetch(appUrl,{
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin", // include, same-origin, *omit
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            redirect: "follow", // manual, *follow, error
            referrer: "no-referrer", // no-referrer, *client
            body: JSON.stringify(data), // body data type must match "Content-Type" header
        })
        // let response = await fetch(appUrl)
        let result = await response.text();
        // var blob = new Blob([buf], {type: 'image/png'})
        // return JSON.stringify(result);
        return result;
    }

    async getInfo(opts) {
        const url = this.url
        // const resource = url.replace('dat://','')
        const data = {url:url, opts:opts}
        const appUrl = DATARCHIVE_URL + 'getInfo'
        let response = await fetch(appUrl,{
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin", // include, same-origin, *omit
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            redirect: "follow", // manual, *follow, error
            referrer: "no-referrer", // no-referrer, *client
            body: JSON.stringify(data), // body data type must match "Content-Type" header
        })
        let result = await response.json();
        // return JSON.stringify(result);
        return result;
    }

    async stat(filename) {
        const url = this.url
        // const resource = url.replace('dat://','')
        // var path = url+ "/" + filename
        const data = {url:url, filename:filename}
        const appUrl = DATARCHIVE_URL + 'stat'
        let response = await fetch(appUrl,{
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin", // include, same-origin, *omit
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            redirect: "follow", // manual, *follow, error
            referrer: "no-referrer", // no-referrer, *client
            body: JSON.stringify(data), // body data type must match "Content-Type" header
        })
        let result = await response.json();
        // return JSON.stringify(result);
        return result;
    }

    async mkdir(filename) {
        const url = this.url
        // const resource = url.replace('dat://','')
        const data = {url:url,filename: filename}
        const appUrl = DATARCHIVE_URL + 'mkdir'
        let response = await fetch(appUrl,{
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin", // include, same-origin, *omit
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            redirect: "follow", // manual, *follow, error
            referrer: "no-referrer", // no-referrer, *client
            body: JSON.stringify(data), // body data type must match "Content-Type" header
        })
        let result;
        try {
            result = await response;
            if (response.status === 400) {
                return response.statusText;
            } else {
                return result;
            }

        } catch (e) {
            alert("Error: " + e)
            console.log("Error: " + e)
        }
    }

    async watch(path, optionalCallback) {
        // @TODO: Support for watching a specific path.
        const url = this.url
        const EE = document.createElement('div')
        const socket = new WebSocket(`${DATARCHIVE_URL.replace('http:','ws:')}watch/${this.url.replace('dat://','')}`);
        socket.addEventListener('message', (event) => {
            let message = { type: '', path: '' }
            try {
                message = JSON.parse(event.data)
            } catch (e) { }
            if (message.type === 'invalidated') EE.dispatchEvent(new CustomEvent('invalidated'))
            if (message.type === 'changed') EE.dispatchEvent(new CustomEvent('changed'))
            if (optionalCallback) optionalCallback({path: message.path})
        })
        return EE
    }

    async writeFile(filename, text) {
        const url = this.url
        // const resource = url.replace('dat://','')
        const data = {url:url,filename: filename,text: text}
        const appUrl = DATARCHIVE_URL + 'writeFile'
        let response = await fetch(appUrl,{
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin", // include, same-origin, *omit
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            redirect: "follow", // manual, *follow, error
            referrer: "no-referrer", // no-referrer, *client
            body: JSON.stringify(data), // body data type must match "Content-Type" header
        })
        let result;
        try {
            result = await response;
            if (response.status === 400) {
                return response.statusText;
            } else {
                return result;
            }

        } catch (e) {
            alert("Error: " + e)
            console.log("Error: " + e)
        }
    }

    static readFile(path, opts) {
        return new DatArchive().readFile(path, opts)
    }

    static create(document) {
        return new DatArchive().create(document)
    }

    static getInfo(opts) {
        return new DatArchive().getInfo(opts)
    }

    static mkdir(filename) {
        return new DatArchive().mkdir(filename)
    }

}

// DatArchive.prototype.readFile = new DatArchive().readFile
// DatArchive.prototype.create = new DatArchive().create

if (!window.DatArchive) {
    doPolyfill()
}

function doPolyfill () {
    window.DatArchive = DatArchiveProxy
}

