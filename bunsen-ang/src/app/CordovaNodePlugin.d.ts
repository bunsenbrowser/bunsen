

/**
 * This plugin defines a global node service
 * Although the object is in the global scope, it is not available until after the deviceready event.
 */
 interface CordovaNodePluginUnused {
  /** Kick things into gear. */
  startServer(): Function;

}

declare var CordovaNodePluginUnused;

// export interface CordovaNodePlugin {
//   // startServer: Function;
//   startServer: () => void;
// }
//
// declare var CordovaNodePlugin: CordovaNodePlugin;


// interface CordovaNodePlugin {
//   startServer(callback: Function;
// }


// export class CordovaNodePlugin {
//   // members
//
//   constructor();
//   startServer: () => void;
//   clone(): CordovaNodePlugin;
// }

// declare module CordovaNodePlugin {
//
//   export function startServer(): Function;
//
// }



// export = CordovaNodePlugin;
//
// /*~ Write your module's methods and properties in this class */
// declare class CordovaNodePlugin {
//   constructor();
//   startServer: Function;
// }
