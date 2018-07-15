///<reference path="../../node_modules/@types/node/index.d.ts"/>
// import { RAN, NoopTransport, RasBridge } from 'random-access-network'
// import {RPC} from 'frame-rpc'
const { RAN, NoopTransport, RasBridge } = require('random-access-network')
// var randomAccess = require('random-access-storage')
const RPC = require('frame-rpc')
import {Buffer} from 'Buffer'

const ANY_ORIGIN = '*'

export class ServerComponent {

  storage: any;
  addArchive: any;
  selectArchive: any;
  private _rpc: any;
  private _bridge: any;


  /**
   * Creates the server for frame-rpc for serving dat content
   * @param {Window} window  The window serving the content
   * @param {Window} client  The child window using the service
   * @param {Object} options Should contain `storage`, `selectArchive`, and `addArchive` implementations
   */
  constructor (window, client, options) {
    Object.assign(this, options)
    this._rpc = RPC(window, client, ANY_ORIGIN, this._methods())
    this._bridge = RasBridge((name) => this._getStorage(name))
  }

  _getStorage (name) {
    const storage = this.storage(name)
    return storage
  }

  _methods () {
    return {
      selectArchive: (options, callback) => {
        console.log("You got the power.")
        this.selectArchive(options, callback)
      },
      addArchive: (key, secretKey, options, callback) => {
        this.addArchive(key, secretKey, options, callback)
      },
      storage: (name, request, callback) => {
        this._bridge(Buffer.from(request), callback)
      }
    }
  }

}
