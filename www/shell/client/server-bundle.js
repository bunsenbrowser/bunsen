(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DemoServer = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const RPC = require('../../rpc')
const idb = require('random-access-idb')

const DEFAULT_SELECT_MESSAGE = 'Select an archive'

const frame = document.getElementById('client-frame')
const form = document.getElementById('selection-form')
const selectionItems = document.getElementById('selection-items')

const selectQueue = []
let currentSelection = null

const storage = idb('dat://storage')

const server = new RPC.Server(window, frame.contentWindow, {
  storage,
  addArchive,
  selectArchive
})

const wikiDat = 'dat://wysiwywiki-pfrazee.hashbase.io'

document.addEventListener('DOMContentLoaded', (event) => {
  console.log('DOMContentLoaded')
  const searchBox = document.getElementById('search')
  const goButton = document.getElementById('go')
  searchBox.value = wikiDat
  goButton.addEventListener('click', addDat)
})

async function addDat () {
  const searchBox = document.getElementById('search')
  const datAddress = searchBox.value
  console.log('added ' + datAddress)
  frame.contentWindow.postMessage(datAddress, '*')
}

form.addEventListener('submit', handleSelected)

window.gatewayServer = server
window.gatewayStorage = storage

function addArchive (key, secretKey, options, callback) {
  const archiveList = getArchives()
  try {
    archiveList.push({
      key,
      secretKey,
      details: options
    })
  } catch (e) {
    console.log('error: ' + e)
  }
  console.log('setting Archives for key: ' + key)
  setArchives(archiveList)
  callback()
}

function selectArchive (options, callback) {
  selectQueue.push({
    options: options,
    callback: callback
  })

  showNext()
}

function showSelection (selectionItem) {
  currentSelection = selectionItem
  const archiveList = getArchives()
  if (archiveList.length !== 0) {
    const renderedItems = archiveList.map((archive) => {
      return `
    <label class="select-item">
      <input type="checkbox" value="${archive.key}">
      ${archive.details.title || archive.key}
    </label><br/>
`
    })
    let toRender = `
    <div class="select-message">
      ${DEFAULT_SELECT_MESSAGE}
    </div>
    ${renderedItems.join('\n')}
`
    if (typeof selectionItem.options !== 'undefined') {
      toRender = `
    <div class="select-message">
      ${selectionItem.options.title || DEFAULT_SELECT_MESSAGE}
    </div>
    ${renderedItems.join('\n')}
`
    }

    selectionItems.innerHTML = toRender
    form.classList.remove('hidden')
  }
}

function showNext () {
  if (!currentSelection) {
    showSelection(selectQueue.shift())
  }
}

function hideForm () {
  form.classList.add('hidden')
}

function handleSelected (e) {
  e.preventDefault()

  if (currentSelection) {
    const input = form.querySelector('input:checked')
    const url = `dat://${input.value}`
    currentSelection.callback(false, url)
    currentSelection = null
  }

  if (selectQueue.length === 0) {
    hideForm()
  } else {
    showNext()
  }
}

function setArchives (newList) {
  try {
    window.localStorage.archives = JSON.stringify(newList)
  } catch (e) {
    console.log('Error: ' + e)
  }
}

function getArchives () {
  return JSON.parse(window.localStorage.archives || '[]')
}

},{"../../rpc":39,"random-access-idb":22}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
(function (Buffer){
var bufferFill = require('buffer-fill')
var allocUnsafe = require('buffer-alloc-unsafe')

module.exports = function alloc (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }

  if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
  
  if (Buffer.alloc) {
    return Buffer.alloc(size, fill, encoding)
  }

  var buffer = allocUnsafe(size)

  if (size === 0) {
    return buffer
  }

  if (fill === undefined) {
    return bufferFill(buffer, 0)
  }

  if (typeof encoding !== 'string') {
    encoding = undefined
  }

  return bufferFill(buffer, fill, encoding)
}

}).call(this,require("buffer").Buffer)

},{"buffer":7,"buffer-alloc-unsafe":5,"buffer-fill":6}],5:[function(require,module,exports){
(function (Buffer){
function allocUnsafe (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }

  if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }

  if (Buffer.allocUnsafe) {
    return Buffer.allocUnsafe(size)
  } else {
    return new Buffer(size)
  }
}

module.exports = allocUnsafe

}).call(this,require("buffer").Buffer)

},{"buffer":7}],6:[function(require,module,exports){
(function (Buffer){
/* Node.js 6.4.0 and up has full support */
var hasFullSupport = (function () {
  try {
    if (!Buffer.isEncoding('latin1')) {
      return false
    }

    var buf = Buffer.alloc ? Buffer.alloc(4) : new Buffer(4)

    buf.fill('ab', 'ucs2')

    return (buf.toString('hex') === '61006200')
  } catch (_) {
    return false
  }
}())

function isSingleByte (val) {
  return (val.length === 1 && val.charCodeAt(0) < 256)
}

function fillWithNumber (buffer, val, start, end) {
  if (start < 0 || end > buffer.length) {
    throw new RangeError('Out of range index')
  }

  start = start >>> 0
  end = end === undefined ? buffer.length : end >>> 0

  if (end > start) {
    buffer.fill(val, start, end)
  }

  return buffer
}

function fillWithBuffer (buffer, val, start, end) {
  if (start < 0 || end > buffer.length) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return buffer
  }

  start = start >>> 0
  end = end === undefined ? buffer.length : end >>> 0

  var pos = start
  var len = val.length
  while (pos <= (end - len)) {
    val.copy(buffer, pos)
    pos += len
  }

  if (pos !== end) {
    val.copy(buffer, pos, 0, end - pos)
  }

  return buffer
}

function fill (buffer, val, start, end, encoding) {
  if (hasFullSupport) {
    return buffer.fill(val, start, end, encoding)
  }

  if (typeof val === 'number') {
    return fillWithNumber(buffer, val, start, end)
  }

  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = buffer.length
    } else if (typeof end === 'string') {
      encoding = end
      end = buffer.length
    }

    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }

    if (encoding === 'latin1') {
      encoding = 'binary'
    }

    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }

    if (val === '') {
      return fillWithNumber(buffer, 0, start, end)
    }

    if (isSingleByte(val)) {
      return fillWithNumber(buffer, val.charCodeAt(0), start, end)
    }

    val = new Buffer(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    return fillWithBuffer(buffer, val, start, end)
  }

  // Other values (e.g. undefined, boolean, object) results in zero-fill
  return fillWithNumber(buffer, 0, start, end)
}

module.exports = fill

}).call(this,require("buffer").Buffer)

},{"buffer":7}],7:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  get: function () {
    if (!(this instanceof Buffer)) {
      return undefined
    }
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  get: function () {
    if (!(this instanceof Buffer)) {
      return undefined
    }
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value) || (value && isArrayBuffer(value.buffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (ArrayBuffer.isView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (ArrayBuffer.isView(buf)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isArrayBuffer(string)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
function isArrayBuffer (obj) {
  return obj instanceof ArrayBuffer ||
    (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
      typeof obj.byteLength === 'number')
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":2,"ieee754":11}],8:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

EventEmitter.prototype.listeners = function listeners(type) {
  var evlistener;
  var ret;
  var events = this._events;

  if (!events)
    ret = [];
  else {
    evlistener = events[type];
    if (!evlistener)
      ret = [];
    else if (typeof evlistener === 'function')
      ret = [evlistener.listener || evlistener];
    else
      ret = unwrapListeners(evlistener);
  }

  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],9:[function(require,module,exports){
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

},{"isarray":10}],10:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],11:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],12:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],13:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],14:[function(require,module,exports){
(function (process,setImmediate){
'use strict';

var callable, byObserver;

callable = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

byObserver = function (Observer) {
	var node = document.createTextNode(''), queue, currentQueue, i = 0;
	new Observer(function () {
		var callback;
		if (!queue) {
			if (!currentQueue) return;
			queue = currentQueue;
		} else if (currentQueue) {
			queue = currentQueue.concat(queue);
		}
		currentQueue = queue;
		queue = null;
		if (typeof currentQueue === 'function') {
			callback = currentQueue;
			currentQueue = null;
			callback();
			return;
		}
		node.data = (i = ++i % 2); // Invoke other batch, to handle leftover callbacks in case of crash
		while (currentQueue) {
			callback = currentQueue.shift();
			if (!currentQueue.length) currentQueue = null;
			callback();
		}
	}).observe(node, { characterData: true });
	return function (fn) {
		callable(fn);
		if (queue) {
			if (typeof queue === 'function') queue = [queue, fn];
			else queue.push(fn);
			return;
		}
		queue = fn;
		node.data = (i = ++i % 2);
	};
};

module.exports = (function () {
	// Node.js
	if ((typeof process === 'object') && process && (typeof process.nextTick === 'function')) {
		return process.nextTick;
	}

	// MutationObserver
	if ((typeof document === 'object') && document) {
		if (typeof MutationObserver === 'function') return byObserver(MutationObserver);
		if (typeof WebKitMutationObserver === 'function') return byObserver(WebKitMutationObserver);
	}

	// W3C Draft
	// http://dvcs.w3.org/hg/webperf/raw-file/tip/specs/setImmediate/Overview.html
	if (typeof setImmediate === 'function') {
		return function (cb) { setImmediate(callable(cb)); };
	}

	// Wide available standard
	if ((typeof setTimeout === 'function') || (typeof setTimeout === 'object')) {
		return function (cb) { setTimeout(callable(cb), 0); };
	}

	return null;
}());

}).call(this,require('_process'),require("timers").setImmediate)

},{"_process":3,"timers":36}],15:[function(require,module,exports){
var wrappy = require('wrappy')
module.exports = wrappy(once)
module.exports.strict = wrappy(onceStrict)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  var name = fn.name || 'Function wrapped with `once`'
  f.onceError = name + " shouldn't be called more than once"
  f.called = false
  return f
}

},{"wrappy":38}],16:[function(require,module,exports){
(function (Buffer){
var varint = require('varint')
var svarint = require('signed-varint')

exports.make = encoder

exports.name = function (enc) {
  var keys = Object.keys(exports)
  for (var i = 0; i < keys.length; i++) {
    if (exports[keys[i]] === enc) return keys[i]
  }
  return null
}

exports.skip = function (type, buffer, offset) {
  switch (type) {
    case 0:
      varint.decode(buffer, offset)
      return offset + varint.decode.bytes

    case 1:
      return offset + 8

    case 2:
      var len = varint.decode(buffer, offset)
      return offset + varint.decode.bytes + len

    case 3:
    case 4:
      throw new Error('Groups are not supported')

    case 5:
      return offset + 4
  }

  throw new Error('Unknown wire type: ' + type)
}

exports.bytes = encoder(2,
  function encode (val, buffer, offset) {
    var oldOffset = offset
    var len = bufferLength(val)

    varint.encode(len, buffer, offset)
    offset += varint.encode.bytes

    if (Buffer.isBuffer(val)) val.copy(buffer, offset)
    else buffer.write(val, offset, len)
    offset += len

    encode.bytes = offset - oldOffset
    return buffer
  },
  function decode (buffer, offset) {
    var oldOffset = offset

    var len = varint.decode(buffer, offset)
    offset += varint.decode.bytes

    var val = buffer.slice(offset, offset + len)
    offset += val.length

    decode.bytes = offset - oldOffset
    return val
  },
  function encodingLength (val) {
    var len = bufferLength(val)
    return varint.encodingLength(len) + len
  }
)

exports.string = encoder(2,
  function encode (val, buffer, offset) {
    var oldOffset = offset
    var len = Buffer.byteLength(val)

    varint.encode(len, buffer, offset, 'utf-8')
    offset += varint.encode.bytes

    buffer.write(val, offset, len)
    offset += len

    encode.bytes = offset - oldOffset
    return buffer
  },
  function decode (buffer, offset) {
    var oldOffset = offset

    var len = varint.decode(buffer, offset)
    offset += varint.decode.bytes

    var val = buffer.toString('utf-8', offset, offset + len)
    offset += len

    decode.bytes = offset - oldOffset
    return val
  },
  function encodingLength (val) {
    var len = Buffer.byteLength(val)
    return varint.encodingLength(len) + len
  }
)

exports.bool = encoder(0,
  function encode (val, buffer, offset) {
    buffer[offset] = val ? 1 : 0
    encode.bytes = 1
    return buffer
  },
  function decode (buffer, offset) {
    var bool = buffer[offset] > 0
    decode.bytes = 1
    return bool
  },
  function encodingLength () {
    return 1
  }
)

exports.int32 = encoder(0,
  function encode (val, buffer, offset) {
    varint.encode(val < 0 ? val + 4294967296 : val, buffer, offset)
    encode.bytes = varint.encode.bytes
    return buffer
  },
  function decode (buffer, offset) {
    var val = varint.decode(buffer, offset)
    decode.bytes = varint.decode.bytes
    return val > 2147483647 ? val - 4294967296 : val
  },
  function encodingLength (val) {
    return varint.encodingLength(val < 0 ? val + 4294967296 : val)
  }
)

exports.int64 = encoder(0,
  function encode (val, buffer, offset) {
    if (val < 0) {
      var last = offset + 9
      varint.encode(val * -1, buffer, offset)
      offset += varint.encode.bytes - 1
      buffer[offset] = buffer[offset] | 0x80
      while (offset < last - 1) {
        offset++
        buffer[offset] = 0xff
      }
      buffer[last] = 0x01
      encode.bytes = 10
    } else {
      varint.encode(val, buffer, offset)
      encode.bytes = varint.encode.bytes
    }
    return buffer
  },
  function decode (buffer, offset) {
    var val = varint.decode(buffer, offset)
    if (val >= Math.pow(2, 63)) {
      var limit = 9
      while (buffer[offset + limit - 1] === 0xff) limit--
      limit = limit || 9
      var subset = Buffer.allocUnsafe(limit)
      buffer.copy(subset, 0, offset, offset + limit)
      subset[limit - 1] = subset[limit - 1] & 0x7f
      val = -1 * varint.decode(subset, 0)
      decode.bytes = 10
    } else {
      decode.bytes = varint.decode.bytes
    }
    return val
  },
  function encodingLength (val) {
    return val < 0 ? 10 : varint.encodingLength(val)
  }
)

exports.sint32 =
exports.sint64 = encoder(0,
  svarint.encode,
  svarint.decode,
  svarint.encodingLength
)

exports.uint32 =
exports.uint64 =
exports.enum =
exports.varint = encoder(0,
  varint.encode,
  varint.decode,
  varint.encodingLength
)

// we cannot represent these in javascript so we just use buffers
exports.fixed64 =
exports.sfixed64 = encoder(1,
  function encode (val, buffer, offset) {
    val.copy(buffer, offset)
    encode.bytes = 8
    return buffer
  },
  function decode (buffer, offset) {
    var val = buffer.slice(offset, offset + 8)
    decode.bytes = 8
    return val
  },
  function encodingLength () {
    return 8
  }
)

exports.double = encoder(1,
  function encode (val, buffer, offset) {
    buffer.writeDoubleLE(val, offset)
    encode.bytes = 8
    return buffer
  },
  function decode (buffer, offset) {
    var val = buffer.readDoubleLE(offset)
    decode.bytes = 8
    return val
  },
  function encodingLength () {
    return 8
  }
)

exports.fixed32 = encoder(5,
  function encode (val, buffer, offset) {
    buffer.writeUInt32LE(val, offset)
    encode.bytes = 4
    return buffer
  },
  function decode (buffer, offset) {
    var val = buffer.readUInt32LE(offset)
    decode.bytes = 4
    return val
  },
  function encodingLength () {
    return 4
  }
)

exports.sfixed32 = encoder(5,
  function encode (val, buffer, offset) {
    buffer.writeInt32LE(val, offset)
    encode.bytes = 4
    return buffer
  },
  function decode (buffer, offset) {
    var val = buffer.readInt32LE(offset)
    decode.bytes = 4
    return val
  },
  function encodingLength () {
    return 4
  }
)

exports.float = encoder(5,
  function encode (val, buffer, offset) {
    buffer.writeFloatLE(val, offset)
    encode.bytes = 4
    return buffer
  },
  function decode (buffer, offset) {
    var val = buffer.readFloatLE(offset)
    decode.bytes = 4
    return val
  },
  function encodingLength () {
    return 4
  }
)

function encoder (type, encode, decode, encodingLength) {
  encode.bytes = decode.bytes = 0

  return {
    type: type,
    encode: encode,
    decode: decode,
    encodingLength: encodingLength
  }
}

function bufferLength (val) {
  return Buffer.isBuffer(val) ? val.length : Buffer.byteLength(val)
}

}).call(this,require("buffer").Buffer)

},{"buffer":7,"signed-varint":31,"varint":19}],17:[function(require,module,exports){
module.exports = read

var MSB = 0x80
  , REST = 0x7F

function read(buf, offset) {
  var res    = 0
    , offset = offset || 0
    , shift  = 0
    , counter = offset
    , b
    , l = buf.length

  do {
    if (counter >= l) {
      read.bytes = 0
      throw new RangeError('Could not decode varint')
    }
    b = buf[counter++]
    res += shift < 28
      ? (b & REST) << shift
      : (b & REST) * Math.pow(2, shift)
    shift += 7
  } while (b >= MSB)

  read.bytes = counter - offset

  return res
}

},{}],18:[function(require,module,exports){
module.exports = encode

var MSB = 0x80
  , REST = 0x7F
  , MSBALL = ~REST
  , INT = Math.pow(2, 31)

function encode(num, out, offset) {
  out = out || []
  offset = offset || 0
  var oldOffset = offset

  while(num >= INT) {
    out[offset++] = (num & 0xFF) | MSB
    num /= 128
  }
  while(num & MSBALL) {
    out[offset++] = (num & 0xFF) | MSB
    num >>>= 7
  }
  out[offset] = num | 0
  
  encode.bytes = offset - oldOffset + 1
  
  return out
}

},{}],19:[function(require,module,exports){
module.exports = {
    encode: require('./encode.js')
  , decode: require('./decode.js')
  , encodingLength: require('./length.js')
}

},{"./decode.js":17,"./encode.js":18,"./length.js":20}],20:[function(require,module,exports){

var N1 = Math.pow(2,  7)
var N2 = Math.pow(2, 14)
var N3 = Math.pow(2, 21)
var N4 = Math.pow(2, 28)
var N5 = Math.pow(2, 35)
var N6 = Math.pow(2, 42)
var N7 = Math.pow(2, 49)
var N8 = Math.pow(2, 56)
var N9 = Math.pow(2, 63)

module.exports = function (value) {
  return (
    value < N1 ? 1
  : value < N2 ? 2
  : value < N3 ? 3
  : value < N4 ? 4
  : value < N5 ? 5
  : value < N6 ? 6
  : value < N7 ? 7
  : value < N8 ? 8
  : value < N9 ? 9
  :              10
  )
}

},{}],21:[function(require,module,exports){
module.exports = function () {
  throw new Error('random-access-file is not supported in the browser')
}

},{}],22:[function(require,module,exports){
(function (Buffer){
var Abstract = require('random-access-storage')
var inherits = require('inherits')
var nextTick = require('next-tick')
var once = require('once')
var blocks = require('./lib/blocks.js')
var bufferFrom = require('buffer-from')
var bufferAlloc = require('buffer-alloc')

var DELIM = '\0'

module.exports = function (dbname, xopts) {
  if (!xopts) xopts = {}
  var idb = xopts.idb || (typeof window !== 'undefined'
    ? window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    : null)
  if (!idb) throw new Error('indexedDB not present and not given')
  var db = null
  var dbqueue = []
  if (typeof idb.open === 'function') {
    var req = idb.open(dbname)
    req.addEventListener('upgradeneeded', function () {
      db = req.result
      db.createObjectStore('data')
    })
    req.addEventListener('success', function () {
      db = req.result
      dbqueue.forEach(function (cb) { cb(db) })
      dbqueue = null
    })
  } else {
    db = idb
  }
  return function (name, opts) {
    if (typeof name === 'object') {
      opts = name
      name = opts.name
    }

    if (!opts) opts = {}
    opts.name = name

    return new Store(Object.assign({ db: getdb }, xopts, opts))
  }
  function getdb (cb) {
    if (db) nextTick(function () { cb(db) })
    else dbqueue.push(cb)
  }
}

function Store (opts) {
  if (!(this instanceof Store)) return new Store(opts)
  Abstract.call(this)
  if (!opts) opts = {}
  if (typeof opts === 'string') opts = { name: opts }
  this.size = opts.size || 4096
  this.name = opts.name
  this.length = opts.length || 0
  this._getdb = opts.db
}
inherits(Store, Abstract)

Store.prototype._blocks = function (i, j) {
  return blocks(this.size, i, j)
}

Store.prototype._read = function (req) {
  var self = this
  var buffers = []
  self._store('readonly', function (err, store) {
    if ((self.length || 0) < req.offset + req.size) {
      return req.callback(new Error('Could not satisfy length'), null)
    }
    if (err) return req.callback(err)
    var offsets = self._blocks(req.offset, req.offset + req.size)
    var pending = offsets.length + 1
    var firstBlock = offsets.length > 0 ? offsets[0].block : 0
    for (var i = 0; i < offsets.length; i++) (function (o) {
      var key = self.name + DELIM + o.block
      backify(store.get(key), function (err, ev) {
        if (err) return req.callback(err)
        buffers[o.block - firstBlock] = ev.target.result
          ? bufferFrom(ev.target.result.subarray(o.start, o.end))
          : bufferAlloc(o.end - o.start)
        if (--pending === 0) req.callback(null, Buffer.concat(buffers))
      })
    })(offsets[i])
    if (--pending === 0) req.callback(null, Buffer.concat(buffers))
  })
}

Store.prototype._write = function (req) {
  var self = this
  self._store('readwrite', function (err, store) {
    if (err) return req.callback(err)
    var offsets = self._blocks(req.offset, req.offset + req.data.length)
    var pending = 1
    var buffers = {}
    for (var i = 0; i < offsets.length; i++) (function (o, i) {
      if (o.end - o.start === self.size) return
      pending++
      var key = self.name + DELIM + o.block
      backify(store.get(key), function (err, ev) {
        if (err) return req.callback(err)
        buffers[i] = bufferFrom(ev.target.result || bufferAlloc(self.size))
        if (--pending === 0) write(store, offsets, buffers)
      })
    })(offsets[i], i)
    if (--pending === 0) write(store, offsets, buffers)
  })

  function write (store, offsets, buffers) {
    var block
    for (var i = 0, j = 0; i < offsets.length; i++) {
      var o = offsets[i]
      var len = o.end - o.start
      if (len === self.size) {
        block = req.data.slice(j, j + len)
      } else {
        block = buffers[i]
        req.data.copy(block, o.start, j, j + len)
      }
      store.put(block, self.name + DELIM + o.block)
      j += len
    }

    var length = Math.max(self.length || 0, req.offset + req.data.length)
    store.put(length, self.name + DELIM + 'length')
    store.transaction.addEventListener('complete', function () {
      self.length = length
      req.callback(null)
    })
    store.transaction.addEventListener('error', req.callback)
  }
}

Store.prototype._store = function (mode, cb) {
  cb = once(cb)
  var self = this
  self._getdb(function (db) {
    var tx = db.transaction(['data'], mode)
    var store = tx.objectStore('data')
    tx.addEventListener('error', cb)
    cb(null, store)
  })
}

Store.prototype._open = function (req) {
  var self = this
  this._getdb(function (db) {
    self._store('readonly', function (err, store) {
      if (err) return req.callback(err)
      backify(store.get(self.name + DELIM + 'length'), function (err, ev) {
        if (err) return req.callback(err)
        self.length = ev.target.result || 0
        req.callback(null)
      })
    })
  })
}

function backify (r, cb) {
  r.addEventListener('success', function (ev) { cb(null, ev) })
  r.addEventListener('error', cb)
}

}).call(this,require("buffer").Buffer)

},{"./lib/blocks.js":23,"buffer":7,"buffer-alloc":4,"buffer-from":24,"inherits":12,"next-tick":14,"once":15,"random-access-storage":30}],23:[function(require,module,exports){
module.exports = function (size, start, end) {
  var result = []
  for (var n = Math.floor(start / size) * size; n < end; n += size) {
    result.push({
      block: Math.floor(n / size),
      start: Math.max(n, start) % size,
      end: Math.min(n + size, end) % size || size
    })
  }
  return result
}

},{}],24:[function(require,module,exports){
(function (Buffer){
var toString = Object.prototype.toString

var isModern = (
  typeof Buffer.alloc === 'function' &&
  typeof Buffer.allocUnsafe === 'function' &&
  typeof Buffer.from === 'function'
)

function isArrayBuffer (input) {
  return toString.call(input).slice(8, -1) === 'ArrayBuffer'
}

function fromArrayBuffer (obj, byteOffset, length) {
  byteOffset >>>= 0

  var maxLength = obj.byteLength - byteOffset

  if (maxLength < 0) {
    throw new RangeError("'offset' is out of bounds")
  }

  if (length === undefined) {
    length = maxLength
  } else {
    length >>>= 0

    if (length > maxLength) {
      throw new RangeError("'length' is out of bounds")
    }
  }

  return isModern
    ? Buffer.from(obj.slice(byteOffset, byteOffset + length))
    : new Buffer(new Uint8Array(obj.slice(byteOffset, byteOffset + length)))
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  return isModern
    ? Buffer.from(string, encoding)
    : new Buffer(string, encoding)
}

function bufferFrom (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value)) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return isModern
    ? Buffer.from(value)
    : new Buffer(value)
}

module.exports = bufferFrom

}).call(this,require("buffer").Buffer)

},{"buffer":7}],25:[function(require,module,exports){
(function (Buffer){
const raf = require('random-access-file')
const {Request, Callback, Action} = require('./proto')
const rafMap = new Map()

function RasBridge (getRas) {
  return function (data, cb) {
    data = Request.decode(data)

    if (!rafMap.has(data.name)) {
      rafMap.set(data.name, getRas(data.name))
    }

    const current = rafMap.get(data.name)

    data.callback = function (error, arg) {
      const response = {id: data.id, error: error, name: data.name, stat: null, data: null}

      if (arg !== undefined) {
        if (Buffer.isBuffer(arg)) response.data = arg
        else response.stat = arg
      }

      cb(Callback.encode(response))
    }

    propagate(data, current)
  }
}

function propagate (request, ras) {
  switch (request.action) {
    case Action.OPEN:
      ras.open(request.callback)
      return
    case Action.OPENREADONLY:
      ras.open(request.callback)
      return
    case Action.READ:
      ras.read(request.offset, request.size, request.callback)
      return
    case Action.WRITE:
      ras.write(request.offset, request.data, request.callback)
      return
    case Action.DEL:
      ras.del(request.offset, request.size, request.callback)
      return
    case Action.STAT:
      ras.stat(request.callback)
      return
    case Action.CLOSE:
      ras.close(request.callback)
      return
    case Action.DESTROY:
      ras.destroy(request.callback)
  }
}

module.exports = RasBridge
module.exports.propagate = propagate

}).call(this,{"isBuffer":require("../is-buffer/index.js")})

},{"../is-buffer/index.js":13,"./proto":27,"random-access-file":21}],26:[function(require,module,exports){
(function (Buffer){
const ras = require('random-access-storage')
const {Action} = require('./proto')
const NoopTransport = require('./transport')
const empty = Buffer.alloc(0)

function RAN (name, transport) {
  transport = transport || new NoopTransport(name)

  function send (action, req) {
    const request = {
      action: action,
      size: req.size || 0,
      offset: req.offset || 0
    }

    if (action === Action.WRITE) {
      request.data = req.data || empty
    }

    transport._queue(request, req)
  }

  return ras({
    open: (req) => send(Action.OPEN, req),
    read: (req) => send(Action.READ, req),
    openReadonly: (req) => send(Action.OPENREADONLY, req),
    write: (req) => send(Action.WRITE, req),
    del: (req) => send(Action.DEL, req),
    stat: (req) => send(Action.STAT, req),
    close: (req) => send(Action.CLOSE, req),
    destroy: (req) => send(Action.DESTROY, req)
  })
}

module.exports = RAN
module.exports.RAN = RAN
module.exports.NoopTransport = NoopTransport
module.exports.StreamTransport = require('./transports/stream')
module.exports.RasBridge = require('./bridge')

}).call(this,require("buffer").Buffer)

},{"./bridge":25,"./proto":27,"./transport":28,"./transports/stream":29,"buffer":7,"random-access-storage":30}],27:[function(require,module,exports){
(function (Buffer){
// This file is auto generated by the protocol-buffers cli tool

/* eslint-disable quotes */
/* eslint-disable indent */
/* eslint-disable no-redeclare */
/* eslint-disable camelcase */

// Remember to `npm install --save protocol-buffers-encodings`
var encodings = require('protocol-buffers-encodings')
var varint = encodings.varint
var skip = encodings.skip

exports.Action = {
  "OPEN": 0,
  "OPENREADONLY": 1,
  "READ": 2,
  "WRITE": 3,
  "DEL": 4,
  "STAT": 5,
  "CLOSE": 6,
  "DESTROY": 7
}

var Request = exports.Request = {
  buffer: true,
  encodingLength: null,
  encode: null,
  decode: null
}

var Error = exports.Error = {
  buffer: true,
  encodingLength: null,
  encode: null,
  decode: null
}

var Stat = exports.Stat = {
  buffer: true,
  encodingLength: null,
  encode: null,
  decode: null
}

var Callback = exports.Callback = {
  buffer: true,
  encodingLength: null,
  encode: null,
  decode: null
}

defineRequest()
defineError()
defineStat()
defineCallback()

function defineRequest () {
  var enc = [
    encodings.enum,
    encodings.string,
    encodings.int32,
    encodings.bytes
  ]

  Request.encodingLength = encodingLength
  Request.encode = encode
  Request.decode = decode

  function encodingLength (obj) {
    var length = 0
    if (!defined(obj.action)) throw new Error("action is required")
    var len = enc[0].encodingLength(obj.action)
    length += 1 + len
    if (!defined(obj.name)) throw new Error("name is required")
    var len = enc[1].encodingLength(obj.name)
    length += 1 + len
    if (!defined(obj.id)) throw new Error("id is required")
    var len = enc[2].encodingLength(obj.id)
    length += 1 + len
    if (!defined(obj.size)) throw new Error("size is required")
    var len = enc[2].encodingLength(obj.size)
    length += 1 + len
    if (!defined(obj.offset)) throw new Error("offset is required")
    var len = enc[2].encodingLength(obj.offset)
    length += 1 + len
    if (defined(obj.data)) {
      var len = enc[3].encodingLength(obj.data)
      length += 1 + len
    }
    return length
  }

  function encode (obj, buf, offset) {
    if (!offset) offset = 0
    if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj))
    var oldOffset = offset
    if (!defined(obj.action)) throw new Error("action is required")
    buf[offset++] = 8
    enc[0].encode(obj.action, buf, offset)
    offset += enc[0].encode.bytes
    if (!defined(obj.name)) throw new Error("name is required")
    buf[offset++] = 18
    enc[1].encode(obj.name, buf, offset)
    offset += enc[1].encode.bytes
    if (!defined(obj.id)) throw new Error("id is required")
    buf[offset++] = 24
    enc[2].encode(obj.id, buf, offset)
    offset += enc[2].encode.bytes
    if (!defined(obj.size)) throw new Error("size is required")
    buf[offset++] = 32
    enc[2].encode(obj.size, buf, offset)
    offset += enc[2].encode.bytes
    if (!defined(obj.offset)) throw new Error("offset is required")
    buf[offset++] = 40
    enc[2].encode(obj.offset, buf, offset)
    offset += enc[2].encode.bytes
    if (defined(obj.data)) {
      buf[offset++] = 50
      enc[3].encode(obj.data, buf, offset)
      offset += enc[3].encode.bytes
    }
    encode.bytes = offset - oldOffset
    return buf
  }

  function decode (buf, offset, end) {
    if (!offset) offset = 0
    if (!end) end = buf.length
    if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid")
    var oldOffset = offset
    var obj = {
      action: 0,
      name: "",
      id: 0,
      size: 0,
      offset: 0,
      data: null
    }
    var found0 = false
    var found1 = false
    var found2 = false
    var found3 = false
    var found4 = false
    while (true) {
      if (end <= offset) {
        if (!found0 || !found1 || !found2 || !found3 || !found4) throw new Error("Decoded message is not valid")
        decode.bytes = offset - oldOffset
        return obj
      }
      var prefix = varint.decode(buf, offset)
      offset += varint.decode.bytes
      var tag = prefix >> 3
      switch (tag) {
        case 1:
        obj.action = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        found0 = true
        break
        case 2:
        obj.name = enc[1].decode(buf, offset)
        offset += enc[1].decode.bytes
        found1 = true
        break
        case 3:
        obj.id = enc[2].decode(buf, offset)
        offset += enc[2].decode.bytes
        found2 = true
        break
        case 4:
        obj.size = enc[2].decode(buf, offset)
        offset += enc[2].decode.bytes
        found3 = true
        break
        case 5:
        obj.offset = enc[2].decode(buf, offset)
        offset += enc[2].decode.bytes
        found4 = true
        break
        case 6:
        obj.data = enc[3].decode(buf, offset)
        offset += enc[3].decode.bytes
        break
        default:
        offset = skip(prefix & 7, buf, offset)
      }
    }
  }
}

function defineError () {
  var enc = [
    encodings.string
  ]

  Error.encodingLength = encodingLength
  Error.encode = encode
  Error.decode = decode

  function encodingLength (obj) {
    var length = 0
    if (!defined(obj.message)) throw new Error("message is required")
    var len = enc[0].encodingLength(obj.message)
    length += 1 + len
    if (!defined(obj.stack)) throw new Error("stack is required")
    var len = enc[0].encodingLength(obj.stack)
    length += 1 + len
    return length
  }

  function encode (obj, buf, offset) {
    if (!offset) offset = 0
    if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj))
    var oldOffset = offset
    if (!defined(obj.message)) throw new Error("message is required")
    buf[offset++] = 10
    enc[0].encode(obj.message, buf, offset)
    offset += enc[0].encode.bytes
    if (!defined(obj.stack)) throw new Error("stack is required")
    buf[offset++] = 18
    enc[0].encode(obj.stack, buf, offset)
    offset += enc[0].encode.bytes
    encode.bytes = offset - oldOffset
    return buf
  }

  function decode (buf, offset, end) {
    if (!offset) offset = 0
    if (!end) end = buf.length
    if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid")
    var oldOffset = offset
    var obj = {
      message: "",
      stack: ""
    }
    var found0 = false
    var found1 = false
    while (true) {
      if (end <= offset) {
        if (!found0 || !found1) throw new Error("Decoded message is not valid")
        decode.bytes = offset - oldOffset
        return obj
      }
      var prefix = varint.decode(buf, offset)
      offset += varint.decode.bytes
      var tag = prefix >> 3
      switch (tag) {
        case 1:
        obj.message = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        found0 = true
        break
        case 2:
        obj.stack = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        found1 = true
        break
        default:
        offset = skip(prefix & 7, buf, offset)
      }
    }
  }
}

function defineStat () {
  var enc = [
    encodings.varint
  ]

  Stat.encodingLength = encodingLength
  Stat.encode = encode
  Stat.decode = decode

  function encodingLength (obj) {
    var length = 0
    if (!defined(obj.mode)) throw new Error("mode is required")
    var len = enc[0].encodingLength(obj.mode)
    length += 1 + len
    if (defined(obj.uid)) {
      var len = enc[0].encodingLength(obj.uid)
      length += 1 + len
    }
    if (defined(obj.gid)) {
      var len = enc[0].encodingLength(obj.gid)
      length += 1 + len
    }
    if (defined(obj.size)) {
      var len = enc[0].encodingLength(obj.size)
      length += 1 + len
    }
    if (defined(obj.blocks)) {
      var len = enc[0].encodingLength(obj.blocks)
      length += 1 + len
    }
    if (defined(obj.offset)) {
      var len = enc[0].encodingLength(obj.offset)
      length += 1 + len
    }
    if (defined(obj.byteOffset)) {
      var len = enc[0].encodingLength(obj.byteOffset)
      length += 1 + len
    }
    if (defined(obj.mtime)) {
      var len = enc[0].encodingLength(obj.mtime)
      length += 1 + len
    }
    if (defined(obj.ctime)) {
      var len = enc[0].encodingLength(obj.ctime)
      length += 1 + len
    }
    return length
  }

  function encode (obj, buf, offset) {
    if (!offset) offset = 0
    if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj))
    var oldOffset = offset
    if (!defined(obj.mode)) throw new Error("mode is required")
    buf[offset++] = 8
    enc[0].encode(obj.mode, buf, offset)
    offset += enc[0].encode.bytes
    if (defined(obj.uid)) {
      buf[offset++] = 16
      enc[0].encode(obj.uid, buf, offset)
      offset += enc[0].encode.bytes
    }
    if (defined(obj.gid)) {
      buf[offset++] = 24
      enc[0].encode(obj.gid, buf, offset)
      offset += enc[0].encode.bytes
    }
    if (defined(obj.size)) {
      buf[offset++] = 32
      enc[0].encode(obj.size, buf, offset)
      offset += enc[0].encode.bytes
    }
    if (defined(obj.blocks)) {
      buf[offset++] = 40
      enc[0].encode(obj.blocks, buf, offset)
      offset += enc[0].encode.bytes
    }
    if (defined(obj.offset)) {
      buf[offset++] = 48
      enc[0].encode(obj.offset, buf, offset)
      offset += enc[0].encode.bytes
    }
    if (defined(obj.byteOffset)) {
      buf[offset++] = 56
      enc[0].encode(obj.byteOffset, buf, offset)
      offset += enc[0].encode.bytes
    }
    if (defined(obj.mtime)) {
      buf[offset++] = 64
      enc[0].encode(obj.mtime, buf, offset)
      offset += enc[0].encode.bytes
    }
    if (defined(obj.ctime)) {
      buf[offset++] = 72
      enc[0].encode(obj.ctime, buf, offset)
      offset += enc[0].encode.bytes
    }
    encode.bytes = offset - oldOffset
    return buf
  }

  function decode (buf, offset, end) {
    if (!offset) offset = 0
    if (!end) end = buf.length
    if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid")
    var oldOffset = offset
    var obj = {
      mode: 0,
      uid: 0,
      gid: 0,
      size: 0,
      blocks: 0,
      offset: 0,
      byteOffset: 0,
      mtime: 0,
      ctime: 0
    }
    var found0 = false
    while (true) {
      if (end <= offset) {
        if (!found0) throw new Error("Decoded message is not valid")
        decode.bytes = offset - oldOffset
        return obj
      }
      var prefix = varint.decode(buf, offset)
      offset += varint.decode.bytes
      var tag = prefix >> 3
      switch (tag) {
        case 1:
        obj.mode = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        found0 = true
        break
        case 2:
        obj.uid = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        break
        case 3:
        obj.gid = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        break
        case 4:
        obj.size = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        break
        case 5:
        obj.blocks = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        break
        case 6:
        obj.offset = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        break
        case 7:
        obj.byteOffset = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        break
        case 8:
        obj.mtime = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        break
        case 9:
        obj.ctime = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        break
        default:
        offset = skip(prefix & 7, buf, offset)
      }
    }
  }
}

function defineCallback () {
  var enc = [
    encodings.int32,
    encodings.string,
    Error,
    Stat,
    encodings.bytes
  ]

  Callback.encodingLength = encodingLength
  Callback.encode = encode
  Callback.decode = decode

  function encodingLength (obj) {
    var length = 0
    if (!defined(obj.id)) throw new Error("id is required")
    var len = enc[0].encodingLength(obj.id)
    length += 1 + len
    if (!defined(obj.name)) throw new Error("name is required")
    var len = enc[1].encodingLength(obj.name)
    length += 1 + len
    if (defined(obj.error)) {
      var len = enc[2].encodingLength(obj.error)
      length += varint.encodingLength(len)
      length += 1 + len
    }
    if (defined(obj.stat)) {
      var len = enc[3].encodingLength(obj.stat)
      length += varint.encodingLength(len)
      length += 1 + len
    }
    if (defined(obj.data)) {
      var len = enc[4].encodingLength(obj.data)
      length += 1 + len
    }
    return length
  }

  function encode (obj, buf, offset) {
    if (!offset) offset = 0
    if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj))
    var oldOffset = offset
    if (!defined(obj.id)) throw new Error("id is required")
    buf[offset++] = 8
    enc[0].encode(obj.id, buf, offset)
    offset += enc[0].encode.bytes
    if (!defined(obj.name)) throw new Error("name is required")
    buf[offset++] = 18
    enc[1].encode(obj.name, buf, offset)
    offset += enc[1].encode.bytes
    if (defined(obj.error)) {
      buf[offset++] = 26
      varint.encode(enc[2].encodingLength(obj.error), buf, offset)
      offset += varint.encode.bytes
      enc[2].encode(obj.error, buf, offset)
      offset += enc[2].encode.bytes
    }
    if (defined(obj.stat)) {
      buf[offset++] = 34
      varint.encode(enc[3].encodingLength(obj.stat), buf, offset)
      offset += varint.encode.bytes
      enc[3].encode(obj.stat, buf, offset)
      offset += enc[3].encode.bytes
    }
    if (defined(obj.data)) {
      buf[offset++] = 42
      enc[4].encode(obj.data, buf, offset)
      offset += enc[4].encode.bytes
    }
    encode.bytes = offset - oldOffset
    return buf
  }

  function decode (buf, offset, end) {
    if (!offset) offset = 0
    if (!end) end = buf.length
    if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid")
    var oldOffset = offset
    var obj = {
      id: 0,
      name: "",
      error: null,
      stat: null,
      data: null
    }
    var found0 = false
    var found1 = false
    while (true) {
      if (end <= offset) {
        if (!found0 || !found1) throw new Error("Decoded message is not valid")
        decode.bytes = offset - oldOffset
        return obj
      }
      var prefix = varint.decode(buf, offset)
      offset += varint.decode.bytes
      var tag = prefix >> 3
      switch (tag) {
        case 1:
        obj.id = enc[0].decode(buf, offset)
        offset += enc[0].decode.bytes
        found0 = true
        break
        case 2:
        obj.name = enc[1].decode(buf, offset)
        offset += enc[1].decode.bytes
        found1 = true
        break
        case 3:
        var len = varint.decode(buf, offset)
        offset += varint.decode.bytes
        obj.error = enc[2].decode(buf, offset, offset + len)
        offset += enc[2].decode.bytes
        break
        case 4:
        var len = varint.decode(buf, offset)
        offset += varint.decode.bytes
        obj.stat = enc[3].decode(buf, offset, offset + len)
        offset += enc[3].decode.bytes
        break
        case 5:
        obj.data = enc[4].decode(buf, offset)
        offset += enc[4].decode.bytes
        break
        default:
        offset = skip(prefix & 7, buf, offset)
      }
    }
  }
}

function defined (val) {
  return val !== null && val !== undefined && (typeof val !== 'number' || !isNaN(val))
}

}).call(this,require("buffer").Buffer)

},{"buffer":7,"protocol-buffers-encodings":16}],28:[function(require,module,exports){
const {Request, Callback} = require('./proto')

function NoopTransport (name) {
  this._callbacks = new Map()
  this._id = 0
  this._name = name
}

/**
 * Called with data to be sent
 * @param {Buffer} data
 */
NoopTransport.prototype.send = function (data) {
  this.onmessage(Callback.encode({id: this._id, error: null, name: this._name}))
}

/**
 * Called when a message is received
 * @param {any} data - you may need to transform it in a Buffer.
 *                     Once done, call `_next` with a Buffer
 *
 * Example:
 * this._next(Buffer.from(data.data))
 */
NoopTransport.prototype.onmessage = function (data) {
  this._next(data)
}

/**
 * Closes the transport
 */
NoopTransport.prototype.close = function () {}

NoopTransport.prototype._next = function (data) {
  data = Callback.decode(data)
  if (data.name !== this._name) {
    return
  }

  const request = this._callbacks.get(data.id)
  request.callback(data.error, data.stat ? data.stat : data.data)
}

NoopTransport.prototype._queue = function (request, origin) {
  const next = ++this._id
  request.name = this._name
  request.id = next
  this._callbacks.set(next, origin)
  this.send(Request.encode(request))
}

module.exports = NoopTransport

},{"./proto":27}],29:[function(require,module,exports){
const NoopTransport = require('../transport')

function StreamTransport (name, stream) {
  NoopTransport.call(this, name)
  this._stream = stream
  this._stream.on('data', (data) => this._next(data))
}

StreamTransport.prototype = Object.create(NoopTransport.prototype)

StreamTransport.prototype.send = function (data) {
  this._stream.write(data)
}

StreamTransport.prototype.close = function () {
  this._sock.close()
}

module.exports = StreamTransport

},{"../transport":28}],30:[function(require,module,exports){
(function (process){
var events = require('events')
var inherits = require('inherits')

var NOT_READABLE = defaultImpl(new Error('Not readable'))
var NOT_WRITABLE = defaultImpl(new Error('Not writable'))
var NOT_DELETABLE = defaultImpl(new Error('Not deletable'))
var NOT_STATABLE = defaultImpl(new Error('Not statable'))
var NO_OPEN_READABLE = defaultImpl(new Error('No readonly open'))

module.exports = RandomAccess

function RandomAccess (opts) {
  if (!(this instanceof RandomAccess)) return new RandomAccess(opts)
  events.EventEmitter.call(this)

  this._queued = []
  this._pending = 0
  this._needsOpen = true

  this.opened = false
  this.closed = false
  this.destroyed = false

  if (opts) {
    if (opts.openReadonly) this._openReadonly = opts.openReadonly
    if (opts.open) this._open = opts.open
    if (opts.read) this._read = opts.read
    if (opts.write) this._write = opts.write
    if (opts.del) this._del = opts.del
    if (opts.stat) this._stat = opts.stat
    if (opts.close) this._close = opts.close
    if (opts.destroy) this._destroy = opts.destroy
  }

  this.preferReadonly = this._openReadonly !== NO_OPEN_READABLE
  this.readable = this._read !== NOT_READABLE
  this.writable = this._write !== NOT_WRITABLE
  this.deletable = this._del !== NOT_DELETABLE
  this.statable = this._stat !== NOT_STATABLE
}

inherits(RandomAccess, events.EventEmitter)

RandomAccess.prototype.open = function (cb) {
  if (!cb) cb = noop
  if (this.opened && !this._needsOpen) return process.nextTick(cb, null)
  queueAndRun(this, new Request(this, 0, 0, 0, null, cb))
}

RandomAccess.prototype._open = defaultImpl(null)
RandomAccess.prototype._openReadonly = NO_OPEN_READABLE

RandomAccess.prototype.read = function (offset, size, cb) {
  this.run(new Request(this, 1, offset, size, null, cb))
}

RandomAccess.prototype._read = NOT_READABLE

RandomAccess.prototype.write = function (offset, data, cb) {
  if (!cb) cb = noop
  openWritable(this)
  this.run(new Request(this, 2, offset, data.length, data, cb))
}

RandomAccess.prototype._write = NOT_WRITABLE

RandomAccess.prototype.del = function (offset, size, cb) {
  if (!cb) cb = noop
  openWritable(this)
  this.run(new Request(this, 3, offset, size, null, cb))
}

RandomAccess.prototype._del = NOT_DELETABLE

RandomAccess.prototype.stat = function (cb) {
  this.run(new Request(this, 4, 0, 0, null, cb))
}

RandomAccess.prototype._stat = NOT_STATABLE

RandomAccess.prototype.close = function (cb) {
  if (!cb) cb = noop
  if (this.closed) return process.nextTick(cb, null)
  queueAndRun(this, new Request(this, 5, 0, 0, null, cb))
}

RandomAccess.prototype._close = defaultImpl(null)

RandomAccess.prototype.destroy = function (cb) {
  if (!cb) cb = noop
  if (!this.closed) this.close(noop)
  queueAndRun(this, new Request(this, 6, 0, 0, null, cb))
}

RandomAccess.prototype._destroy = defaultImpl(null)

RandomAccess.prototype.run = function (req) {
  if (this._needsOpen) this.open(noop)
  if (this._queued.length) this._queued.push(req)
  else req._run()
}

function noop () {}

function Request (self, type, offset, size, data, cb) {
  this.type = type
  this.offset = offset
  this.data = data
  this.size = size
  this.storage = self

  this._sync = false
  this._callback = cb
}

Request.prototype._unqueue = function (err) {
  var ra = this.storage
  var queued = ra._queued

  if (!err) {
    switch (this.type) {
      case 0:
        if (!ra.opened) {
          ra.opened = true
          ra.emit('open')
        }
        break

      case 5:
        if (!ra.closed) {
          ra.closed = true
          ra.emit('close')
        }
        break

      case 6:
        if (!ra.destroyed) {
          ra.destroyed = true
          ra.emit('destroy')
        }
        break
    }
  }

  if (queued.length && queued[0] === this) queued.shift()
  if (!--ra._pending && queued.length) queued[0]._run()
}

Request.prototype.callback = function (err, val) {
  if (this._sync) return nextTick(this, err, val)
  this._unqueue(err)
  this._callback(err, val)
}

Request.prototype._openAndNotClosed = function () {
  var ra = this.storage
  if (ra.opened && !ra.closed) return true
  if (!ra.opened) nextTick(this, new Error('Not opened'))
  else if (ra.closed) nextTick(this, new Error('Closed'))
  return false
}

Request.prototype._open = function () {
  var ra = this.storage

  if (ra.opened && !ra._needsOpen) return nextTick(this, null)
  if (ra.closed) return nextTick(this, new Error('Closed'))

  ra._needsOpen = false
  if (ra.preferReadonly) ra._openReadonly(this)
  else ra._open(this)
}

Request.prototype._run = function () {
  var ra = this.storage
  ra._pending++

  this._sync = true

  switch (this.type) {
    case 0:
      this._open()
      break

    case 1:
      if (this._openAndNotClosed()) ra._read(this)
      break

    case 2:
      if (this._openAndNotClosed()) ra._write(this)
      break

    case 3:
      if (this._openAndNotClosed()) ra._del(this)
      break

    case 4:
      if (this._openAndNotClosed()) ra._stat(this)
      break

    case 5:
      if (ra.closed || !ra.opened) nextTick(this, null)
      else ra._close(this)
      break

    case 6:
      if (ra.destroyed) nextTick(this, null)
      else ra._destroy(this)
      break
  }

  this._sync = false
}

function queueAndRun (self, req) {
  self._queued.push(req)
  if (!self._pending) req._run()
}

function openWritable (self) {
  if (self.preferReadonly) {
    self._needsOpen = true
    self.preferReadonly = false
  }
}

function defaultImpl (err) {
  return overridable

  function overridable (req) {
    nextTick(req, err)
  }
}

function nextTick (req, err, val) {
  process.nextTick(nextTickCallback, req, err, val)
}

function nextTickCallback (req, err, val) {
  req.callback(err, val)
}

}).call(this,require('_process'))

},{"_process":3,"events":8,"inherits":12}],31:[function(require,module,exports){
var varint = require('varint')
exports.encode = function encode (v, b, o) {
  v = v >= 0 ? v*2 : v*-2 - 1
  var r = varint.encode(v, b, o)
  encode.bytes = varint.encode.bytes
  return r
}
exports.decode = function decode (b, o) {
  var v = varint.decode(b, o)
  decode.bytes = varint.decode.bytes
  return v & 1 ? (v+1) / -2 : v / 2
}

exports.encodingLength = function (v) {
  return varint.encodingLength(v >= 0 ? v*2 : v*-2 - 1)
}

},{"varint":34}],32:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17}],33:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18}],34:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"./decode.js":32,"./encode.js":33,"./length.js":35,"dup":19}],35:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],36:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":37,"timers":36}],37:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"dup":3}],38:[function(require,module,exports){
// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}

},{}],39:[function(require,module,exports){
(function (Buffer){
const { RAN, NoopTransport, RasBridge } = require('random-access-network')
var randomAccess = require('random-access-storage')
const RPC = require('frame-rpc')

const ANY_ORIGIN = '*'

class Client {
  /**
   * Creates the client for frame-rpc for reading dat content
   * @param {Window} window The window the client is running in
   * @param {Window} server The window the parent of the service is running in
   */
  constructor (window, server) {
    this._rpc = RPC(window, server, ANY_ORIGIN, this._methods())
  }

  getStorage () {
    return (name) => {
      return RAN(name, new RPCTransport(name, this._rpc))
    }
  }

  selectArchive (options, callback) {
    this._rpc.call('selectArchive', options, callback)
  }

  addArchive (key, secretKey, options, callback) {
    this._rpc.call('addArchive', key, secretKey, options, callback)
  }

  _methods () {
    return {
      // Client doesn't provide any methods
    }
  }
}

class Server {
  /**
   * Creates the server for frame-rpc for serving dat content
   * @param {Window} window  The window serving the content
   * @param {Window} client  The child window using the service
   * @param {Object} options Should contain `storage`, `selectArchive`, and `addArchive` implementations
   */
  constructor (window, client, options) {
    Object.assign(this, options)
    // this._wrapStorage()
    this._rpc = RPC(window, client, ANY_ORIGIN, this._methods())
    this._bridge = RasBridge((name) => this._getStorage(name))
  }

  // _wrapStorage () {
  //   const rawStorage = this.storage
  //
  //   this.storage = (name) => {
  //     const access = rawStorage(name)
  //     return randomAccess({
  //       open: (request) => {
  //         access.open(request.callback.bind(request))
  //       },
  //       read: (request) => {
  //         access.read(request.offset, request.size, request.callback.bind(request))
  //       },
  //       write: (request) => {
  //         access.write(request.offset, request.data, request.callback.bind(request))
  //       },
  //       del: (request) => {
  //         access.del(request.offset, request.size, request.callback.bind(request))
  //       },
  //       close: (request) => {
  //         access.close(request.callback.bind(request))
  //       },
  //       destroy: (request) => {
  //         access.destroy(request.callback.bind(request))
  //       }
  //     })
  //   }
  // }

  _getStorage (name) {
    const storage = this.storage(name)
    return storage
  }

  _methods () {
    return {
      selectArchive: (options, callback) => {
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

class RPCTransport extends NoopTransport {
  constructor (name, rpc) {
    super(name)
    this._rpc = rpc
  }
  send (request) {
    this._rpc.call('storage', this._name, request, (response) => {
      this._next(Buffer.from(response))
    })
  }
  close () {
    // ¯\_(ツ)_/¯
  }
}

module.exports = {
  Client: Client,
  Server: Server
}

}).call(this,require("buffer").Buffer)

},{"buffer":7,"frame-rpc":9,"random-access-network":26,"random-access-storage":30}],"graceful-fs":[function(require,module,exports){

},{}]},{},[1])("graceful-fs")
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZW1vL3NlcnZlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9iYXNlNjQtanMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2J1ZmZlci1hbGxvYy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9idWZmZXItYWxsb2Mvbm9kZV9tb2R1bGVzL2J1ZmZlci1hbGxvYy11bnNhZmUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnVmZmVyLWZpbGwvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJub2RlX21vZHVsZXMvZnJhbWUtcnBjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZyYW1lLXJwYy9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvaXMtYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL25leHQtdGljay9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vbmNlL29uY2UuanMiLCJub2RlX21vZHVsZXMvcHJvdG9jb2wtYnVmZmVycy1lbmNvZGluZ3MvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvdG9jb2wtYnVmZmVycy1lbmNvZGluZ3Mvbm9kZV9tb2R1bGVzL3ZhcmludC9kZWNvZGUuanMiLCJub2RlX21vZHVsZXMvcHJvdG9jb2wtYnVmZmVycy1lbmNvZGluZ3Mvbm9kZV9tb2R1bGVzL3ZhcmludC9lbmNvZGUuanMiLCJub2RlX21vZHVsZXMvcHJvdG9jb2wtYnVmZmVycy1lbmNvZGluZ3Mvbm9kZV9tb2R1bGVzL3ZhcmludC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2NvbC1idWZmZXJzLWVuY29kaW5ncy9ub2RlX21vZHVsZXMvdmFyaW50L2xlbmd0aC5qcyIsIm5vZGVfbW9kdWxlcy9yYW5kb20tYWNjZXNzLWZpbGUvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9yYW5kb20tYWNjZXNzLWlkYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yYW5kb20tYWNjZXNzLWlkYi9saWIvYmxvY2tzLmpzIiwibm9kZV9tb2R1bGVzL3JhbmRvbS1hY2Nlc3MtaWRiL25vZGVfbW9kdWxlcy9idWZmZXItZnJvbS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yYW5kb20tYWNjZXNzLW5ldHdvcmsvYnJpZGdlLmpzIiwibm9kZV9tb2R1bGVzL3JhbmRvbS1hY2Nlc3MtbmV0d29yay9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yYW5kb20tYWNjZXNzLW5ldHdvcmsvcHJvdG8uanMiLCJub2RlX21vZHVsZXMvcmFuZG9tLWFjY2Vzcy1uZXR3b3JrL3RyYW5zcG9ydC5qcyIsIm5vZGVfbW9kdWxlcy9yYW5kb20tYWNjZXNzLW5ldHdvcmsvdHJhbnNwb3J0cy9zdHJlYW0uanMiLCJub2RlX21vZHVsZXMvcmFuZG9tLWFjY2Vzcy1zdG9yYWdlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3NpZ25lZC12YXJpbnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy93cmFwcHkvd3JhcHB5LmpzIiwicnBjLmpzIiwiZnMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4c0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZnQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeGpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RIQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IFJQQyA9IHJlcXVpcmUoJy4uLy4uL3JwYycpXG5jb25zdCBpZGIgPSByZXF1aXJlKCdyYW5kb20tYWNjZXNzLWlkYicpXG5cbmNvbnN0IERFRkFVTFRfU0VMRUNUX01FU1NBR0UgPSAnU2VsZWN0IGFuIGFyY2hpdmUnXG5cbmNvbnN0IGZyYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NsaWVudC1mcmFtZScpXG5jb25zdCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbGVjdGlvbi1mb3JtJylcbmNvbnN0IHNlbGVjdGlvbkl0ZW1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbGVjdGlvbi1pdGVtcycpXG5cbmNvbnN0IHNlbGVjdFF1ZXVlID0gW11cbmxldCBjdXJyZW50U2VsZWN0aW9uID0gbnVsbFxuXG5jb25zdCBzdG9yYWdlID0gaWRiKCdkYXQ6Ly9zdG9yYWdlJylcblxuY29uc3Qgc2VydmVyID0gbmV3IFJQQy5TZXJ2ZXIod2luZG93LCBmcmFtZS5jb250ZW50V2luZG93LCB7XG4gIHN0b3JhZ2UsXG4gIGFkZEFyY2hpdmUsXG4gIHNlbGVjdEFyY2hpdmVcbn0pXG5cbmNvbnN0IHdpa2lEYXQgPSAnZGF0Oi8vd3lzaXd5d2lraS1wZnJhemVlLmhhc2hiYXNlLmlvJ1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKGV2ZW50KSA9PiB7XG4gIGNvbnNvbGUubG9nKCdET01Db250ZW50TG9hZGVkJylcbiAgY29uc3Qgc2VhcmNoQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlYXJjaCcpXG4gIGNvbnN0IGdvQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dvJylcbiAgc2VhcmNoQm94LnZhbHVlID0gd2lraURhdFxuICBnb0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFkZERhdClcbn0pXG5cbmFzeW5jIGZ1bmN0aW9uIGFkZERhdCAoKSB7XG4gIGNvbnN0IHNlYXJjaEJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWFyY2gnKVxuICBjb25zdCBkYXRBZGRyZXNzID0gc2VhcmNoQm94LnZhbHVlXG4gIGNvbnNvbGUubG9nKCdhZGRlZCAnICsgZGF0QWRkcmVzcylcbiAgZnJhbWUuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZShkYXRBZGRyZXNzLCAnKicpXG59XG5cbmZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgaGFuZGxlU2VsZWN0ZWQpXG5cbndpbmRvdy5nYXRld2F5U2VydmVyID0gc2VydmVyXG53aW5kb3cuZ2F0ZXdheVN0b3JhZ2UgPSBzdG9yYWdlXG5cbmZ1bmN0aW9uIGFkZEFyY2hpdmUgKGtleSwgc2VjcmV0S2V5LCBvcHRpb25zLCBjYWxsYmFjaykge1xuICBjb25zdCBhcmNoaXZlTGlzdCA9IGdldEFyY2hpdmVzKClcbiAgdHJ5IHtcbiAgICBhcmNoaXZlTGlzdC5wdXNoKHtcbiAgICAgIGtleSxcbiAgICAgIHNlY3JldEtleSxcbiAgICAgIGRldGFpbHM6IG9wdGlvbnNcbiAgICB9KVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yOiAnICsgZSlcbiAgfVxuICBjb25zb2xlLmxvZygnc2V0dGluZyBBcmNoaXZlcyBmb3Iga2V5OiAnICsga2V5KVxuICBzZXRBcmNoaXZlcyhhcmNoaXZlTGlzdClcbiAgY2FsbGJhY2soKVxufVxuXG5mdW5jdGlvbiBzZWxlY3RBcmNoaXZlIChvcHRpb25zLCBjYWxsYmFjaykge1xuICBzZWxlY3RRdWV1ZS5wdXNoKHtcbiAgICBvcHRpb25zOiBvcHRpb25zLFxuICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICB9KVxuXG4gIHNob3dOZXh0KClcbn1cblxuZnVuY3Rpb24gc2hvd1NlbGVjdGlvbiAoc2VsZWN0aW9uSXRlbSkge1xuICBjdXJyZW50U2VsZWN0aW9uID0gc2VsZWN0aW9uSXRlbVxuICBjb25zdCBhcmNoaXZlTGlzdCA9IGdldEFyY2hpdmVzKClcbiAgaWYgKGFyY2hpdmVMaXN0Lmxlbmd0aCAhPT0gMCkge1xuICAgIGNvbnN0IHJlbmRlcmVkSXRlbXMgPSBhcmNoaXZlTGlzdC5tYXAoKGFyY2hpdmUpID0+IHtcbiAgICAgIHJldHVybiBgXG4gICAgPGxhYmVsIGNsYXNzPVwic2VsZWN0LWl0ZW1cIj5cbiAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiB2YWx1ZT1cIiR7YXJjaGl2ZS5rZXl9XCI+XG4gICAgICAke2FyY2hpdmUuZGV0YWlscy50aXRsZSB8fCBhcmNoaXZlLmtleX1cbiAgICA8L2xhYmVsPjxici8+XG5gXG4gICAgfSlcbiAgICBsZXQgdG9SZW5kZXIgPSBgXG4gICAgPGRpdiBjbGFzcz1cInNlbGVjdC1tZXNzYWdlXCI+XG4gICAgICAke0RFRkFVTFRfU0VMRUNUX01FU1NBR0V9XG4gICAgPC9kaXY+XG4gICAgJHtyZW5kZXJlZEl0ZW1zLmpvaW4oJ1xcbicpfVxuYFxuICAgIGlmICh0eXBlb2Ygc2VsZWN0aW9uSXRlbS5vcHRpb25zICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdG9SZW5kZXIgPSBgXG4gICAgPGRpdiBjbGFzcz1cInNlbGVjdC1tZXNzYWdlXCI+XG4gICAgICAke3NlbGVjdGlvbkl0ZW0ub3B0aW9ucy50aXRsZSB8fCBERUZBVUxUX1NFTEVDVF9NRVNTQUdFfVxuICAgIDwvZGl2PlxuICAgICR7cmVuZGVyZWRJdGVtcy5qb2luKCdcXG4nKX1cbmBcbiAgICB9XG5cbiAgICBzZWxlY3Rpb25JdGVtcy5pbm5lckhUTUwgPSB0b1JlbmRlclxuICAgIGZvcm0uY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJylcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG93TmV4dCAoKSB7XG4gIGlmICghY3VycmVudFNlbGVjdGlvbikge1xuICAgIHNob3dTZWxlY3Rpb24oc2VsZWN0UXVldWUuc2hpZnQoKSlcbiAgfVxufVxuXG5mdW5jdGlvbiBoaWRlRm9ybSAoKSB7XG4gIGZvcm0uY2xhc3NMaXN0LmFkZCgnaGlkZGVuJylcbn1cblxuZnVuY3Rpb24gaGFuZGxlU2VsZWN0ZWQgKGUpIHtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgaWYgKGN1cnJlbnRTZWxlY3Rpb24pIHtcbiAgICBjb25zdCBpbnB1dCA9IGZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXQ6Y2hlY2tlZCcpXG4gICAgY29uc3QgdXJsID0gYGRhdDovLyR7aW5wdXQudmFsdWV9YFxuICAgIGN1cnJlbnRTZWxlY3Rpb24uY2FsbGJhY2soZmFsc2UsIHVybClcbiAgICBjdXJyZW50U2VsZWN0aW9uID0gbnVsbFxuICB9XG5cbiAgaWYgKHNlbGVjdFF1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgIGhpZGVGb3JtKClcbiAgfSBlbHNlIHtcbiAgICBzaG93TmV4dCgpXG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0QXJjaGl2ZXMgKG5ld0xpc3QpIHtcbiAgdHJ5IHtcbiAgICB3aW5kb3cubG9jYWxTdG9yYWdlLmFyY2hpdmVzID0gSlNPTi5zdHJpbmdpZnkobmV3TGlzdClcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUubG9nKCdFcnJvcjogJyArIGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0QXJjaGl2ZXMgKCkge1xuICByZXR1cm4gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlLmFyY2hpdmVzIHx8ICdbXScpXG59XG4iLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuZXhwb3J0cy50b0J5dGVBcnJheSA9IHRvQnl0ZUFycmF5XG5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSBmcm9tQnl0ZUFycmF5XG5cbnZhciBsb29rdXAgPSBbXVxudmFyIHJldkxvb2t1cCA9IFtdXG52YXIgQXJyID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnID8gVWludDhBcnJheSA6IEFycmF5XG5cbnZhciBjb2RlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG5mb3IgKHZhciBpID0gMCwgbGVuID0gY29kZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICBsb29rdXBbaV0gPSBjb2RlW2ldXG4gIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaVxufVxuXG4vLyBTdXBwb3J0IGRlY29kaW5nIFVSTC1zYWZlIGJhc2U2NCBzdHJpbmdzLCBhcyBOb2RlLmpzIGRvZXMuXG4vLyBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NCNVUkxfYXBwbGljYXRpb25zXG5yZXZMb29rdXBbJy0nLmNoYXJDb2RlQXQoMCldID0gNjJcbnJldkxvb2t1cFsnXycuY2hhckNvZGVBdCgwKV0gPSA2M1xuXG5mdW5jdGlvbiBnZXRMZW5zIChiNjQpIHtcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcblxuICBpZiAobGVuICUgNCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuICB9XG5cbiAgLy8gVHJpbSBvZmYgZXh0cmEgYnl0ZXMgYWZ0ZXIgcGxhY2Vob2xkZXIgYnl0ZXMgYXJlIGZvdW5kXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2JlYXRnYW1taXQvYmFzZTY0LWpzL2lzc3Vlcy80MlxuICB2YXIgdmFsaWRMZW4gPSBiNjQuaW5kZXhPZignPScpXG4gIGlmICh2YWxpZExlbiA9PT0gLTEpIHZhbGlkTGVuID0gbGVuXG5cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IHZhbGlkTGVuID09PSBsZW5cbiAgICA/IDBcbiAgICA6IDQgLSAodmFsaWRMZW4gJSA0KVxuXG4gIHJldHVybiBbdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbl1cbn1cblxuLy8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChiNjQpIHtcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gX2J5dGVMZW5ndGggKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikge1xuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cblxuICB2YXIgYXJyID0gbmV3IEFycihfYnl0ZUxlbmd0aChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pKVxuXG4gIHZhciBjdXJCeXRlID0gMFxuXG4gIC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcbiAgdmFyIGxlbiA9IHBsYWNlSG9sZGVyc0xlbiA+IDBcbiAgICA/IHZhbGlkTGVuIC0gNFxuICAgIDogdmFsaWRMZW5cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDE4KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgMTIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA8PCA2KSB8XG4gICAgICByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDMpXVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiAxNikgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMikge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPj4gNClcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDEpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTApIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCA0KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPj4gMilcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG4gIHJldHVybiBsb29rdXBbbnVtID4+IDE4ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gMTIgJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiA2ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gJiAweDNGXVxufVxuXG5mdW5jdGlvbiBlbmNvZGVDaHVuayAodWludDgsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHRtcFxuICB2YXIgb3V0cHV0ID0gW11cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpICs9IDMpIHtcbiAgICB0bXAgPVxuICAgICAgKCh1aW50OFtpXSA8PCAxNikgJiAweEZGMDAwMCkgK1xuICAgICAgKCh1aW50OFtpICsgMV0gPDwgOCkgJiAweEZGMDApICtcbiAgICAgICh1aW50OFtpICsgMl0gJiAweEZGKVxuICAgIG91dHB1dC5wdXNoKHRyaXBsZXRUb0Jhc2U2NCh0bXApKVxuICB9XG4gIHJldHVybiBvdXRwdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gZnJvbUJ5dGVBcnJheSAodWludDgpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVuID0gdWludDgubGVuZ3RoXG4gIHZhciBleHRyYUJ5dGVzID0gbGVuICUgMyAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuICB2YXIgcGFydHMgPSBbXVxuICB2YXIgbWF4Q2h1bmtMZW5ndGggPSAxNjM4MyAvLyBtdXN0IGJlIG11bHRpcGxlIG9mIDNcblxuICAvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4yID0gbGVuIC0gZXh0cmFCeXRlczsgaSA8IGxlbjI7IGkgKz0gbWF4Q2h1bmtMZW5ndGgpIHtcbiAgICBwYXJ0cy5wdXNoKGVuY29kZUNodW5rKFxuICAgICAgdWludDgsIGksIChpICsgbWF4Q2h1bmtMZW5ndGgpID4gbGVuMiA/IGxlbjIgOiAoaSArIG1heENodW5rTGVuZ3RoKVxuICAgICkpXG4gIH1cblxuICAvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG4gIGlmIChleHRyYUJ5dGVzID09PSAxKSB7XG4gICAgdG1wID0gdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAyXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCA0KSAmIDB4M0ZdICtcbiAgICAgICc9PSdcbiAgICApXG4gIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA9PT0gMikge1xuICAgIHRtcCA9ICh1aW50OFtsZW4gLSAyXSA8PCA4KSArIHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMTBdICtcbiAgICAgIGxvb2t1cFsodG1wID4+IDQpICYgMHgzRl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgMikgJiAweDNGXSArXG4gICAgICAnPSdcbiAgICApXG4gIH1cblxuICByZXR1cm4gcGFydHMuam9pbignJylcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJ2YXIgYnVmZmVyRmlsbCA9IHJlcXVpcmUoJ2J1ZmZlci1maWxsJylcbnZhciBhbGxvY1Vuc2FmZSA9IHJlcXVpcmUoJ2J1ZmZlci1hbGxvYy11bnNhZmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGFsbG9jIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBhIG51bWJlcicpXG4gIH1cblxuICBpZiAoc2l6ZSA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgbmVnYXRpdmUnKVxuICB9XG4gIFxuICBpZiAoQnVmZmVyLmFsbG9jKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYyhzaXplLCBmaWxsLCBlbmNvZGluZylcbiAgfVxuXG4gIHZhciBidWZmZXIgPSBhbGxvY1Vuc2FmZShzaXplKVxuXG4gIGlmIChzaXplID09PSAwKSB7XG4gICAgcmV0dXJuIGJ1ZmZlclxuICB9XG5cbiAgaWYgKGZpbGwgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBidWZmZXJGaWxsKGJ1ZmZlciwgMClcbiAgfVxuXG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSB1bmRlZmluZWRcbiAgfVxuXG4gIHJldHVybiBidWZmZXJGaWxsKGJ1ZmZlciwgZmlsbCwgZW5jb2RpbmcpXG59XG4iLCJmdW5jdGlvbiBhbGxvY1Vuc2FmZSAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBhIG51bWJlcicpXG4gIH1cblxuICBpZiAoc2l6ZSA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgbmVnYXRpdmUnKVxuICB9XG5cbiAgaWYgKEJ1ZmZlci5hbGxvY1Vuc2FmZSkge1xuICAgIHJldHVybiBCdWZmZXIuYWxsb2NVbnNhZmUoc2l6ZSlcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihzaXplKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYWxsb2NVbnNhZmVcbiIsIi8qIE5vZGUuanMgNi40LjAgYW5kIHVwIGhhcyBmdWxsIHN1cHBvcnQgKi9cbnZhciBoYXNGdWxsU3VwcG9ydCA9IChmdW5jdGlvbiAoKSB7XG4gIHRyeSB7XG4gICAgaWYgKCFCdWZmZXIuaXNFbmNvZGluZygnbGF0aW4xJykpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHZhciBidWYgPSBCdWZmZXIuYWxsb2MgPyBCdWZmZXIuYWxsb2MoNCkgOiBuZXcgQnVmZmVyKDQpXG5cbiAgICBidWYuZmlsbCgnYWInLCAndWNzMicpXG5cbiAgICByZXR1cm4gKGJ1Zi50b1N0cmluZygnaGV4JykgPT09ICc2MTAwNjIwMCcpXG4gIH0gY2F0Y2ggKF8pIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSgpKVxuXG5mdW5jdGlvbiBpc1NpbmdsZUJ5dGUgKHZhbCkge1xuICByZXR1cm4gKHZhbC5sZW5ndGggPT09IDEgJiYgdmFsLmNoYXJDb2RlQXQoMCkgPCAyNTYpXG59XG5cbmZ1bmN0aW9uIGZpbGxXaXRoTnVtYmVyIChidWZmZXIsIHZhbCwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPCAwIHx8IGVuZCA+IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBidWZmZXIubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKGVuZCA+IHN0YXJ0KSB7XG4gICAgYnVmZmVyLmZpbGwodmFsLCBzdGFydCwgZW5kKVxuICB9XG5cbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG5mdW5jdGlvbiBmaWxsV2l0aEJ1ZmZlciAoYnVmZmVyLCB2YWwsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiBidWZmZXIubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ091dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIGJ1ZmZlclxuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGJ1ZmZlci5sZW5ndGggOiBlbmQgPj4+IDBcblxuICB2YXIgcG9zID0gc3RhcnRcbiAgdmFyIGxlbiA9IHZhbC5sZW5ndGhcbiAgd2hpbGUgKHBvcyA8PSAoZW5kIC0gbGVuKSkge1xuICAgIHZhbC5jb3B5KGJ1ZmZlciwgcG9zKVxuICAgIHBvcyArPSBsZW5cbiAgfVxuXG4gIGlmIChwb3MgIT09IGVuZCkge1xuICAgIHZhbC5jb3B5KGJ1ZmZlciwgcG9zLCAwLCBlbmQgLSBwb3MpXG4gIH1cblxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGZpbGwgKGJ1ZmZlciwgdmFsLCBzdGFydCwgZW5kLCBlbmNvZGluZykge1xuICBpZiAoaGFzRnVsbFN1cHBvcnQpIHtcbiAgICByZXR1cm4gYnVmZmVyLmZpbGwodmFsLCBzdGFydCwgZW5kLCBlbmNvZGluZylcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBmaWxsV2l0aE51bWJlcihidWZmZXIsIHZhbCwgc3RhcnQsIGVuZClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IGJ1ZmZlci5sZW5ndGhcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IGVuZFxuICAgICAgZW5kID0gYnVmZmVyLmxlbmd0aFxuICAgIH1cblxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cblxuICAgIGlmIChlbmNvZGluZyA9PT0gJ2xhdGluMScpIHtcbiAgICAgIGVuY29kaW5nID0gJ2JpbmFyeSdcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuXG4gICAgaWYgKHZhbCA9PT0gJycpIHtcbiAgICAgIHJldHVybiBmaWxsV2l0aE51bWJlcihidWZmZXIsIDAsIHN0YXJ0LCBlbmQpXG4gICAgfVxuXG4gICAgaWYgKGlzU2luZ2xlQnl0ZSh2YWwpKSB7XG4gICAgICByZXR1cm4gZmlsbFdpdGhOdW1iZXIoYnVmZmVyLCB2YWwuY2hhckNvZGVBdCgwKSwgc3RhcnQsIGVuZClcbiAgICB9XG5cbiAgICB2YWwgPSBuZXcgQnVmZmVyKHZhbCwgZW5jb2RpbmcpXG4gIH1cblxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbCkpIHtcbiAgICByZXR1cm4gZmlsbFdpdGhCdWZmZXIoYnVmZmVyLCB2YWwsIHN0YXJ0LCBlbmQpXG4gIH1cblxuICAvLyBPdGhlciB2YWx1ZXMgKGUuZy4gdW5kZWZpbmVkLCBib29sZWFuLCBvYmplY3QpIHJlc3VsdHMgaW4gemVyby1maWxsXG4gIHJldHVybiBmaWxsV2l0aE51bWJlcihidWZmZXIsIDAsIHN0YXJ0LCBlbmQpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZmlsbFxuIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gU2xvd0J1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5cbnZhciBLX01BWF9MRU5HVEggPSAweDdmZmZmZmZmXG5leHBvcnRzLmtNYXhMZW5ndGggPSBLX01BWF9MRU5HVEhcblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgUHJpbnQgd2FybmluZyBhbmQgcmVjb21tZW5kIHVzaW5nIGBidWZmZXJgIHY0Lnggd2hpY2ggaGFzIGFuIE9iamVjdFxuICogICAgICAgICAgICAgICBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogV2UgcmVwb3J0IHRoYXQgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0eXBlZCBhcnJheXMgaWYgdGhlIGFyZSBub3Qgc3ViY2xhc3NhYmxlXG4gKiB1c2luZyBfX3Byb3RvX18uIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgXG4gKiAoU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzgpLiBJRSAxMCBsYWNrcyBzdXBwb3J0XG4gKiBmb3IgX19wcm90b19fIGFuZCBoYXMgYSBidWdneSB0eXBlZCBhcnJheSBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSB0eXBlZEFycmF5U3VwcG9ydCgpXG5cbmlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgY29uc29sZS5lcnJvcihcbiAgICAnVGhpcyBicm93c2VyIGxhY2tzIHR5cGVkIGFycmF5IChVaW50OEFycmF5KSBzdXBwb3J0IHdoaWNoIGlzIHJlcXVpcmVkIGJ5ICcgK1xuICAgICdgYnVmZmVyYCB2NS54LiBVc2UgYGJ1ZmZlcmAgdjQueCBpZiB5b3UgcmVxdWlyZSBvbGQgYnJvd3NlciBzdXBwb3J0LidcbiAgKVxufVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIC8vIENhbiB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZD9cbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuX19wcm90b19fID0ge19fcHJvdG9fXzogVWludDhBcnJheS5wcm90b3R5cGUsIGZvbzogZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfX1cbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MlxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlci5wcm90b3R5cGUsICdwYXJlbnQnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclxuICB9XG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ29mZnNldCcsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYnl0ZU9mZnNldFxuICB9XG59KVxuXG5mdW5jdGlvbiBjcmVhdGVCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAobGVuZ3RoID4gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0ludmFsaWQgdHlwZWQgYXJyYXkgbGVuZ3RoJylcbiAgfVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbi8qKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBoYXZlIHRoZWlyXG4gKiBwcm90b3R5cGUgY2hhbmdlZCB0byBgQnVmZmVyLnByb3RvdHlwZWAuIEZ1cnRoZXJtb3JlLCBgQnVmZmVyYCBpcyBhIHN1YmNsYXNzIG9mXG4gKiBgVWludDhBcnJheWAsIHNvIHRoZSByZXR1cm5lZCBpbnN0YW5jZXMgd2lsbCBoYXZlIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBtZXRob2RzXG4gKiBhbmQgdGhlIGBVaW50OEFycmF5YCBtZXRob2RzLiBTcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdFxuICogcmV0dXJucyBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBUaGUgYFVpbnQ4QXJyYXlgIHByb3RvdHlwZSByZW1haW5zIHVubW9kaWZpZWQuXG4gKi9cblxuZnVuY3Rpb24gQnVmZmVyIChhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZ09yT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnSWYgZW5jb2RpbmcgaXMgc3BlY2lmaWVkIHRoZW4gdGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBzdHJpbmcnXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZShhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20oYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgJiZcbiAgICBCdWZmZXJbU3ltYm9sLnNwZWNpZXNdID09PSBCdWZmZXIpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlciwgU3ltYm9sLnNwZWNpZXMsIHtcbiAgICB2YWx1ZTogbnVsbCxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pXG59XG5cbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG5mdW5jdGlvbiBmcm9tICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIGEgbnVtYmVyJylcbiAgfVxuXG4gIGlmIChpc0FycmF5QnVmZmVyKHZhbHVlKSB8fCAodmFsdWUgJiYgaXNBcnJheUJ1ZmZlcih2YWx1ZS5idWZmZXIpKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQpXG4gIH1cblxuICByZXR1cm4gZnJvbU9iamVjdCh2YWx1ZSlcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB0byBCdWZmZXIoYXJnLCBlbmNvZGluZykgYnV0IHRocm93cyBhIFR5cGVFcnJvclxuICogaWYgdmFsdWUgaXMgYSBudW1iZXIuXG4gKiBCdWZmZXIuZnJvbShzdHJbLCBlbmNvZGluZ10pXG4gKiBCdWZmZXIuZnJvbShhcnJheSlcbiAqIEJ1ZmZlci5mcm9tKGJ1ZmZlcilcbiAqIEJ1ZmZlci5mcm9tKGFycmF5QnVmZmVyWywgYnl0ZU9mZnNldFssIGxlbmd0aF1dKVxuICoqL1xuQnVmZmVyLmZyb20gPSBmdW5jdGlvbiAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gZnJvbSh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBOb3RlOiBDaGFuZ2UgcHJvdG90eXBlICphZnRlciogQnVmZmVyLmZyb20gaXMgZGVmaW5lZCB0byB3b3JrYXJvdW5kIENocm9tZSBidWc6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzE0OFxuQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcblxuZnVuY3Rpb24gYXNzZXJ0U2l6ZSAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIG51bWJlcicpXG4gIH0gZWxzZSBpZiAoc2l6ZSA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgbmVnYXRpdmUnKVxuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG9jIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIGlmIChzaXplIDw9IDApIHtcbiAgICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG4gIH1cbiAgaWYgKGZpbGwgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIE9ubHkgcGF5IGF0dGVudGlvbiB0byBlbmNvZGluZyBpZiBpdCdzIGEgc3RyaW5nLiBUaGlzXG4gICAgLy8gcHJldmVudHMgYWNjaWRlbnRhbGx5IHNlbmRpbmcgaW4gYSBudW1iZXIgdGhhdCB3b3VsZFxuICAgIC8vIGJlIGludGVycHJldHRlZCBhcyBhIHN0YXJ0IG9mZnNldC5cbiAgICByZXR1cm4gdHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJ1xuICAgICAgPyBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsLCBlbmNvZGluZylcbiAgICAgIDogY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbClcbiAgfVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBmaWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogYWxsb2Moc2l6ZVssIGZpbGxbLCBlbmNvZGluZ11dKVxuICoqL1xuQnVmZmVyLmFsbG9jID0gZnVuY3Rpb24gKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIHJldHVybiBhbGxvYyhzaXplLCBmaWxsLCBlbmNvZGluZylcbn1cblxuZnVuY3Rpb24gYWxsb2NVbnNhZmUgKHNpemUpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUgPCAwID8gMCA6IGNoZWNrZWQoc2l6ZSkgfCAwKVxufVxuXG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gQnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gU2xvd0J1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICovXG5CdWZmZXIuYWxsb2NVbnNhZmVTbG93ID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcgKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycgfHwgZW5jb2RpbmcgPT09ICcnKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgfVxuXG4gIGlmICghQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICB9XG5cbiAgdmFyIGxlbmd0aCA9IGJ5dGVMZW5ndGgoc3RyaW5nLCBlbmNvZGluZykgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuXG4gIHZhciBhY3R1YWwgPSBidWYud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcblxuICBpZiAoYWN0dWFsICE9PSBsZW5ndGgpIHtcbiAgICAvLyBXcml0aW5nIGEgaGV4IHN0cmluZywgZm9yIGV4YW1wbGUsIHRoYXQgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzIHdpbGxcbiAgICAvLyBjYXVzZSBldmVyeXRoaW5nIGFmdGVyIHRoZSBmaXJzdCBpbnZhbGlkIGNoYXJhY3RlciB0byBiZSBpZ25vcmVkLiAoZS5nLlxuICAgIC8vICdhYnh4Y2QnIHdpbGwgYmUgdHJlYXRlZCBhcyAnYWInKVxuICAgIGJ1ZiA9IGJ1Zi5zbGljZSgwLCBhY3R1YWwpXG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGggPCAwID8gMCA6IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBidWZbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyIChhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmIChieXRlT2Zmc2V0IDwgMCB8fCBhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcIm9mZnNldFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQgKyAobGVuZ3RoIHx8IDApKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wibGVuZ3RoXCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIHZhciBidWZcbiAgaWYgKGJ5dGVPZmZzZXQgPT09IHVuZGVmaW5lZCAmJiBsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5KVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQpXG4gIH0gZWxzZSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAob2JqKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqKSkge1xuICAgIHZhciBsZW4gPSBjaGVja2VkKG9iai5sZW5ndGgpIHwgMFxuICAgIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuKVxuXG4gICAgaWYgKGJ1Zi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBidWZcbiAgICB9XG5cbiAgICBvYmouY29weShidWYsIDAsIDAsIGxlbilcbiAgICByZXR1cm4gYnVmXG4gIH1cblxuICBpZiAob2JqKSB7XG4gICAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhvYmopIHx8ICdsZW5ndGgnIGluIG9iaikge1xuICAgICAgaWYgKHR5cGVvZiBvYmoubGVuZ3RoICE9PSAnbnVtYmVyJyB8fCBudW1iZXJJc05hTihvYmoubGVuZ3RoKSkge1xuICAgICAgICByZXR1cm4gY3JlYXRlQnVmZmVyKDApXG4gICAgICB9XG4gICAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmopXG4gICAgfVxuXG4gICAgaWYgKG9iai50eXBlID09PSAnQnVmZmVyJyAmJiBBcnJheS5pc0FycmF5KG9iai5kYXRhKSkge1xuICAgICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqLmRhdGEpXG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgb3IgQXJyYXktbGlrZSBPYmplY3QuJylcbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IEtfTUFYX0xFTkdUSGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsgS19NQVhfTEVOR1RILnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAoK2xlbmd0aCAhPSBsZW5ndGgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbiAgICBsZW5ndGggPSAwXG4gIH1cbiAgcmV0dXJuIEJ1ZmZlci5hbGxvYygrbGVuZ3RoKVxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyID09PSB0cnVlXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIG11c3QgYmUgQnVmZmVycycpXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXVxuICAgICAgeSA9IGJbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBCdWZmZXIuYWxsb2MoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZmZlciA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJ1ZiA9IGxpc3RbaV1cbiAgICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KGJ1ZikpIHtcbiAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKGJ1ZilcbiAgICB9XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgaXNBcnJheUJ1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5ieXRlTGVuZ3RoXG4gIH1cbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgc3RyaW5nID0gJycgKyBzdHJpbmdcbiAgfVxuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gbGVuICogMlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGxlbiA+Pj4gMVxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoIC8vIGFzc3VtZSB1dGY4XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIC8vIE5vIG5lZWQgdG8gdmVyaWZ5IHRoYXQgXCJ0aGlzLmxlbmd0aCA8PSBNQVhfVUlOVDMyXCIgc2luY2UgaXQncyBhIHJlYWQtb25seVxuICAvLyBwcm9wZXJ0eSBvZiBhIHR5cGVkIGFycmF5LlxuXG4gIC8vIFRoaXMgYmVoYXZlcyBuZWl0aGVyIGxpa2UgU3RyaW5nIG5vciBVaW50OEFycmF5IGluIHRoYXQgd2Ugc2V0IHN0YXJ0L2VuZFxuICAvLyB0byB0aGVpciB1cHBlci9sb3dlciBib3VuZHMgaWYgdGhlIHZhbHVlIHBhc3NlZCBpcyBvdXQgb2YgcmFuZ2UuXG4gIC8vIHVuZGVmaW5lZCBpcyBoYW5kbGVkIHNwZWNpYWxseSBhcyBwZXIgRUNNQS0yNjIgNnRoIEVkaXRpb24sXG4gIC8vIFNlY3Rpb24gMTMuMy4zLjcgUnVudGltZSBTZW1hbnRpY3M6IEtleWVkQmluZGluZ0luaXRpYWxpemF0aW9uLlxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCB8fCBzdGFydCA8IDApIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICAvLyBSZXR1cm4gZWFybHkgaWYgc3RhcnQgPiB0aGlzLmxlbmd0aC4gRG9uZSBoZXJlIHRvIHByZXZlbnQgcG90ZW50aWFsIHVpbnQzMlxuICAvLyBjb2VyY2lvbiBmYWlsIGJlbG93LlxuICBpZiAoc3RhcnQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbmQgPD0gMCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgLy8gRm9yY2UgY29lcnNpb24gdG8gdWludDMyLiBUaGlzIHdpbGwgYWxzbyBjb2VyY2UgZmFsc2V5L05hTiB2YWx1ZXMgdG8gMC5cbiAgZW5kID4+Pj0gMFxuICBzdGFydCA+Pj49IDBcblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuLy8gVGhpcyBwcm9wZXJ0eSBpcyB1c2VkIGJ5IGBCdWZmZXIuaXNCdWZmZXJgIChhbmQgdGhlIGBpcy1idWZmZXJgIG5wbSBwYWNrYWdlKVxuLy8gdG8gZGV0ZWN0IGEgQnVmZmVyIGluc3RhbmNlLiBJdCdzIG5vdCBwb3NzaWJsZSB0byB1c2UgYGluc3RhbmNlb2YgQnVmZmVyYFxuLy8gcmVsaWFibHkgaW4gYSBicm93c2VyaWZ5IGNvbnRleHQgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZSBkaWZmZXJlbnRcbi8vIGNvcGllcyBvZiB0aGUgJ2J1ZmZlcicgcGFja2FnZSBpbiB1c2UuIFRoaXMgbWV0aG9kIHdvcmtzIGV2ZW4gZm9yIEJ1ZmZlclxuLy8gaW5zdGFuY2VzIHRoYXQgd2VyZSBjcmVhdGVkIGZyb20gYW5vdGhlciBjb3B5IG9mIHRoZSBgYnVmZmVyYCBwYWNrYWdlLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9pc3N1ZXMvMTU0XG5CdWZmZXIucHJvdG90eXBlLl9pc0J1ZmZlciA9IHRydWVcblxuZnVuY3Rpb24gc3dhcCAoYiwgbiwgbSkge1xuICB2YXIgaSA9IGJbbl1cbiAgYltuXSA9IGJbbV1cbiAgYlttXSA9IGlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMTYgPSBmdW5jdGlvbiBzd2FwMTYgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDIgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDE2LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAxKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDMyID0gZnVuY3Rpb24gc3dhcDMyICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA0ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAzMi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgMilcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXA2NCA9IGZ1bmN0aW9uIHN3YXA2NCAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgOCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNjQtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gOCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDcpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDYpXG4gICAgc3dhcCh0aGlzLCBpICsgMiwgaSArIDUpXG4gICAgc3dhcCh0aGlzLCBpICsgMywgaSArIDQpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nID0gQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZ1xuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAodGFyZ2V0LCBzdGFydCwgZW5kLCB0aGlzU3RhcnQsIHRoaXNFbmQpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICB9XG5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICBpZiAoZW5kID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmQgPSB0YXJnZXQgPyB0YXJnZXQubGVuZ3RoIDogMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNTdGFydCA9IDBcbiAgfVxuICBpZiAodGhpc0VuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc0VuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoc3RhcnQgPCAwIHx8IGVuZCA+IHRhcmdldC5sZW5ndGggfHwgdGhpc1N0YXJ0IDwgMCB8fCB0aGlzRW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCAmJiBzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIGlmIChzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgc3RhcnQgPj4+PSAwXG4gIGVuZCA+Pj49IDBcbiAgdGhpc1N0YXJ0ID4+Pj0gMFxuICB0aGlzRW5kID4+Pj0gMFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQpIHJldHVybiAwXG5cbiAgdmFyIHggPSB0aGlzRW5kIC0gdGhpc1N0YXJ0XG4gIHZhciB5ID0gZW5kIC0gc3RhcnRcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG5cbiAgdmFyIHRoaXNDb3B5ID0gdGhpcy5zbGljZSh0aGlzU3RhcnQsIHRoaXNFbmQpXG4gIHZhciB0YXJnZXRDb3B5ID0gdGFyZ2V0LnNsaWNlKHN0YXJ0LCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzQ29weVtpXSAhPT0gdGFyZ2V0Q29weVtpXSkge1xuICAgICAgeCA9IHRoaXNDb3B5W2ldXG4gICAgICB5ID0gdGFyZ2V0Q29weVtpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbi8vIEZpbmRzIGVpdGhlciB0aGUgZmlyc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0ID49IGBieXRlT2Zmc2V0YCxcbi8vIE9SIHRoZSBsYXN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA8PSBgYnl0ZU9mZnNldGAuXG4vL1xuLy8gQXJndW1lbnRzOlxuLy8gLSBidWZmZXIgLSBhIEJ1ZmZlciB0byBzZWFyY2hcbi8vIC0gdmFsIC0gYSBzdHJpbmcsIEJ1ZmZlciwgb3IgbnVtYmVyXG4vLyAtIGJ5dGVPZmZzZXQgLSBhbiBpbmRleCBpbnRvIGBidWZmZXJgOyB3aWxsIGJlIGNsYW1wZWQgdG8gYW4gaW50MzJcbi8vIC0gZW5jb2RpbmcgLSBhbiBvcHRpb25hbCBlbmNvZGluZywgcmVsZXZhbnQgaXMgdmFsIGlzIGEgc3RyaW5nXG4vLyAtIGRpciAtIHRydWUgZm9yIGluZGV4T2YsIGZhbHNlIGZvciBsYXN0SW5kZXhPZlxuZnVuY3Rpb24gYmlkaXJlY3Rpb25hbEluZGV4T2YgKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIC8vIEVtcHR5IGJ1ZmZlciBtZWFucyBubyBtYXRjaFxuICBpZiAoYnVmZmVyLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXRcbiAgaWYgKHR5cGVvZiBieXRlT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gYnl0ZU9mZnNldFxuICAgIGJ5dGVPZmZzZXQgPSAwXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIHtcbiAgICBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkge1xuICAgIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICB9XG4gIGJ5dGVPZmZzZXQgPSArYnl0ZU9mZnNldCAgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKG51bWJlcklzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbmZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgdmFyIGluZGV4U2l6ZSA9IDFcbiAgdmFyIGFyckxlbmd0aCA9IGFyci5sZW5ndGhcbiAgdmFyIHZhbExlbmd0aCA9IHZhbC5sZW5ndGhcblxuICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKGVuY29kaW5nID09PSAndWNzMicgfHwgZW5jb2RpbmcgPT09ICd1Y3MtMicgfHxcbiAgICAgICAgZW5jb2RpbmcgPT09ICd1dGYxNmxlJyB8fCBlbmNvZGluZyA9PT0gJ3V0Zi0xNmxlJykge1xuICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgaW5kZXhTaXplID0gMlxuICAgICAgYXJyTGVuZ3RoIC89IDJcbiAgICAgIHZhbExlbmd0aCAvPSAyXG4gICAgICBieXRlT2Zmc2V0IC89IDJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChidWYsIGkpIHtcbiAgICBpZiAoaW5kZXhTaXplID09PSAxKSB7XG4gICAgICByZXR1cm4gYnVmW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBidWYucmVhZFVJbnQxNkJFKGkgKiBpbmRleFNpemUpXG4gICAgfVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGRpcikge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpIDwgYXJyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWFkKGFyciwgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWxMZW5ndGgpIHJldHVybiBmb3VuZEluZGV4ICogaW5kZXhTaXplXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm91bmRJbmRleCAhPT0gLTEpIGkgLT0gaSAtIGZvdW5kSW5kZXhcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChieXRlT2Zmc2V0ICsgdmFsTGVuZ3RoID4gYXJyTGVuZ3RoKSBieXRlT2Zmc2V0ID0gYXJyTGVuZ3RoIC0gdmFsTGVuZ3RoXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciBmb3VuZCA9IHRydWVcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHJlYWQoYXJyLCBpICsgaikgIT09IHJlYWQodmFsLCBqKSkge1xuICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gdGhpcy5pbmRleE9mKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpICE9PSAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCB0cnVlKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gbGFzdEluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKG51bWJlcklzTmFOKHBhcnNlZCkpIHJldHVybiBpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBsYXRpbjFXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoID4+PiAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQnVmZmVyLndyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldFssIGxlbmd0aF0pIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnXG4gICAgKVxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBsYXRpbjFTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgKGJ5dGVzW2kgKyAxXSAqIDI1NikpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IHNob3VsZCBiZSBhIEJ1ZmZlcicpXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5jb3B5V2l0aGluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gVXNlIGJ1aWx0LWluIHdoZW4gYXZhaWxhYmxlLCBtaXNzaW5nIGZyb20gSUUxMVxuICAgIHRoaXMuY29weVdpdGhpbih0YXJnZXRTdGFydCwgc3RhcnQsIGVuZClcbiAgfSBlbHNlIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAodmFyIGkgPSBsZW4gLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgVWludDhBcnJheS5wcm90b3R5cGUuc2V0LmNhbGwoXG4gICAgICB0YXJnZXQsXG4gICAgICB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpLFxuICAgICAgdGFyZ2V0U3RhcnRcbiAgICApXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIFVzYWdlOlxuLy8gICAgYnVmZmVyLmZpbGwobnVtYmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChidWZmZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKHN0cmluZ1ssIG9mZnNldFssIGVuZF1dWywgZW5jb2RpbmddKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsLCBzdGFydCwgZW5kLCBlbmNvZGluZykge1xuICAvLyBIYW5kbGUgc3RyaW5nIGNhc2VzOlxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodHlwZW9mIHN0YXJ0ID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBzdGFydFxuICAgICAgc3RhcnQgPSAwXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVuZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gZW5kXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH1cbiAgICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdlbmNvZGluZyBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZycgJiYgIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgIH1cbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIGNvZGUgPSB2YWwuY2hhckNvZGVBdCgwKVxuICAgICAgaWYgKChlbmNvZGluZyA9PT0gJ3V0ZjgnICYmIGNvZGUgPCAxMjgpIHx8XG4gICAgICAgICAgZW5jb2RpbmcgPT09ICdsYXRpbjEnKSB7XG4gICAgICAgIC8vIEZhc3QgcGF0aDogSWYgYHZhbGAgZml0cyBpbnRvIGEgc2luZ2xlIGJ5dGUsIHVzZSB0aGF0IG51bWVyaWMgdmFsdWUuXG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiBuZXcgQnVmZmVyKHZhbCwgZW5jb2RpbmcpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyB2YWwgK1xuICAgICAgICAnXCIgaXMgaW52YWxpZCBmb3IgYXJndW1lbnQgXCJ2YWx1ZVwiJylcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGVuZCAtIHN0YXJ0OyArK2kpIHtcbiAgICAgIHRoaXNbaSArIHN0YXJ0XSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSB0YWtlcyBlcXVhbCBzaWducyBhcyBlbmQgb2YgdGhlIEJhc2U2NCBlbmNvZGluZ1xuICBzdHIgPSBzdHIuc3BsaXQoJz0nKVswXVxuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyLnRyaW0oKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbi8vIEFycmF5QnVmZmVycyBmcm9tIGFub3RoZXIgY29udGV4dCAoaS5lLiBhbiBpZnJhbWUpIGRvIG5vdCBwYXNzIHRoZSBgaW5zdGFuY2VvZmAgY2hlY2tcbi8vIGJ1dCB0aGV5IHNob3VsZCBiZSB0cmVhdGVkIGFzIHZhbGlkLiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNjZcbmZ1bmN0aW9uIGlzQXJyYXlCdWZmZXIgKG9iaikge1xuICByZXR1cm4gb2JqIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHxcbiAgICAob2JqICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdBcnJheUJ1ZmZlcicgJiZcbiAgICAgIHR5cGVvZiBvYmouYnl0ZUxlbmd0aCA9PT0gJ251bWJlcicpXG59XG5cbmZ1bmN0aW9uIG51bWJlcklzTmFOIChvYmopIHtcbiAgcmV0dXJuIG9iaiAhPT0gb2JqIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIG9iamVjdENyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgb2JqZWN0Q3JlYXRlUG9seWZpbGxcbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgb2JqZWN0S2V5c1BvbHlmaWxsXG52YXIgYmluZCA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kIHx8IGZ1bmN0aW9uQmluZFBvbHlmaWxsXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCAnX2V2ZW50cycpKSB7XG4gICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbnZhciBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbnZhciBoYXNEZWZpbmVQcm9wZXJ0eTtcbnRyeSB7XG4gIHZhciBvID0ge307XG4gIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCAneCcsIHsgdmFsdWU6IDAgfSk7XG4gIGhhc0RlZmluZVByb3BlcnR5ID0gby54ID09PSAwO1xufSBjYXRjaCAoZXJyKSB7IGhhc0RlZmluZVByb3BlcnR5ID0gZmFsc2UgfVxuaWYgKGhhc0RlZmluZVByb3BlcnR5KSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIsICdkZWZhdWx0TWF4TGlzdGVuZXJzJywge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbihhcmcpIHtcbiAgICAgIC8vIGNoZWNrIHdoZXRoZXIgdGhlIGlucHV0IGlzIGEgcG9zaXRpdmUgbnVtYmVyICh3aG9zZSB2YWx1ZSBpcyB6ZXJvIG9yXG4gICAgICAvLyBncmVhdGVyIGFuZCBub3QgYSBOYU4pLlxuICAgICAgaWYgKHR5cGVvZiBhcmcgIT09ICdudW1iZXInIHx8IGFyZyA8IDAgfHwgYXJnICE9PSBhcmcpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiZGVmYXVsdE1heExpc3RlbmVyc1wiIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgICAgIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSBhcmc7XG4gICAgfVxuICB9KTtcbn0gZWxzZSB7XG4gIEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gZGVmYXVsdE1heExpc3RlbmVycztcbn1cblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKG4pIHtcbiAgaWYgKHR5cGVvZiBuICE9PSAnbnVtYmVyJyB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcIm5cIiBhcmd1bWVudCBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gJGdldE1heExpc3RlbmVycyh0aGF0KSB7XG4gIGlmICh0aGF0Ll9tYXhMaXN0ZW5lcnMgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gIHJldHVybiB0aGF0Ll9tYXhMaXN0ZW5lcnM7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZ2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gZ2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gJGdldE1heExpc3RlbmVycyh0aGlzKTtcbn07XG5cbi8vIFRoZXNlIHN0YW5kYWxvbmUgZW1pdCogZnVuY3Rpb25zIGFyZSB1c2VkIHRvIG9wdGltaXplIGNhbGxpbmcgb2YgZXZlbnRcbi8vIGhhbmRsZXJzIGZvciBmYXN0IGNhc2VzIGJlY2F1c2UgZW1pdCgpIGl0c2VsZiBvZnRlbiBoYXMgYSB2YXJpYWJsZSBudW1iZXIgb2Zcbi8vIGFyZ3VtZW50cyBhbmQgY2FuIGJlIGRlb3B0aW1pemVkIGJlY2F1c2Ugb2YgdGhhdC4gVGhlc2UgZnVuY3Rpb25zIGFsd2F5cyBoYXZlXG4vLyB0aGUgc2FtZSBudW1iZXIgb2YgYXJndW1lbnRzIGFuZCB0aHVzIGRvIG5vdCBnZXQgZGVvcHRpbWl6ZWQsIHNvIHRoZSBjb2RlXG4vLyBpbnNpZGUgdGhlbSBjYW4gZXhlY3V0ZSBmYXN0ZXIuXG5mdW5jdGlvbiBlbWl0Tm9uZShoYW5kbGVyLCBpc0ZuLCBzZWxmKSB7XG4gIGlmIChpc0ZuKVxuICAgIGhhbmRsZXIuY2FsbChzZWxmKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHNlbGYpO1xuICB9XG59XG5mdW5jdGlvbiBlbWl0T25lKGhhbmRsZXIsIGlzRm4sIHNlbGYsIGFyZzEpIHtcbiAgaWYgKGlzRm4pXG4gICAgaGFuZGxlci5jYWxsKHNlbGYsIGFyZzEpO1xuICBlbHNlIHtcbiAgICB2YXIgbGVuID0gaGFuZGxlci5sZW5ndGg7XG4gICAgdmFyIGxpc3RlbmVycyA9IGFycmF5Q2xvbmUoaGFuZGxlciwgbGVuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKVxuICAgICAgbGlzdGVuZXJzW2ldLmNhbGwoc2VsZiwgYXJnMSk7XG4gIH1cbn1cbmZ1bmN0aW9uIGVtaXRUd28oaGFuZGxlciwgaXNGbiwgc2VsZiwgYXJnMSwgYXJnMikge1xuICBpZiAoaXNGbilcbiAgICBoYW5kbGVyLmNhbGwoc2VsZiwgYXJnMSwgYXJnMik7XG4gIGVsc2Uge1xuICAgIHZhciBsZW4gPSBoYW5kbGVyLmxlbmd0aDtcbiAgICB2YXIgbGlzdGVuZXJzID0gYXJyYXlDbG9uZShoYW5kbGVyLCBsZW4pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpXG4gICAgICBsaXN0ZW5lcnNbaV0uY2FsbChzZWxmLCBhcmcxLCBhcmcyKTtcbiAgfVxufVxuZnVuY3Rpb24gZW1pdFRocmVlKGhhbmRsZXIsIGlzRm4sIHNlbGYsIGFyZzEsIGFyZzIsIGFyZzMpIHtcbiAgaWYgKGlzRm4pXG4gICAgaGFuZGxlci5jYWxsKHNlbGYsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICBlbHNlIHtcbiAgICB2YXIgbGVuID0gaGFuZGxlci5sZW5ndGg7XG4gICAgdmFyIGxpc3RlbmVycyA9IGFycmF5Q2xvbmUoaGFuZGxlciwgbGVuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKVxuICAgICAgbGlzdGVuZXJzW2ldLmNhbGwoc2VsZiwgYXJnMSwgYXJnMiwgYXJnMyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZW1pdE1hbnkoaGFuZGxlciwgaXNGbiwgc2VsZiwgYXJncykge1xuICBpZiAoaXNGbilcbiAgICBoYW5kbGVyLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICBlbHNlIHtcbiAgICB2YXIgbGVuID0gaGFuZGxlci5sZW5ndGg7XG4gICAgdmFyIGxpc3RlbmVycyA9IGFycmF5Q2xvbmUoaGFuZGxlciwgbGVuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgZXZlbnRzO1xuICB2YXIgZG9FcnJvciA9ICh0eXBlID09PSAnZXJyb3InKTtcblxuICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gIGlmIChldmVudHMpXG4gICAgZG9FcnJvciA9IChkb0Vycm9yICYmIGV2ZW50cy5lcnJvciA9PSBudWxsKTtcbiAgZWxzZSBpZiAoIWRvRXJyb3IpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKGRvRXJyb3IpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpXG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEF0IGxlYXN0IGdpdmUgc29tZSBraW5kIG9mIGNvbnRleHQgdG8gdGhlIHVzZXJcbiAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1VuaGFuZGxlZCBcImVycm9yXCIgZXZlbnQuICgnICsgZXIgKyAnKScpO1xuICAgICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaGFuZGxlciA9IGV2ZW50c1t0eXBlXTtcblxuICBpZiAoIWhhbmRsZXIpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBpc0ZuID0gdHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbic7XG4gIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gIHN3aXRjaCAobGVuKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgY2FzZSAxOlxuICAgICAgZW1pdE5vbmUoaGFuZGxlciwgaXNGbiwgdGhpcyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDI6XG4gICAgICBlbWl0T25lKGhhbmRsZXIsIGlzRm4sIHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICBlbWl0VHdvKGhhbmRsZXIsIGlzRm4sIHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNDpcbiAgICAgIGVtaXRUaHJlZShoYW5kbGVyLCBpc0ZuLCB0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSwgYXJndW1lbnRzWzNdKTtcbiAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgZGVmYXVsdDpcbiAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgZW1pdE1hbnkoaGFuZGxlciwgaXNGbiwgdGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmZ1bmN0aW9uIF9hZGRMaXN0ZW5lcih0YXJnZXQsIHR5cGUsIGxpc3RlbmVyLCBwcmVwZW5kKSB7XG4gIHZhciBtO1xuICB2YXIgZXZlbnRzO1xuICB2YXIgZXhpc3Rpbmc7XG5cbiAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RlbmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHM7XG4gIGlmICghZXZlbnRzKSB7XG4gICAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHMgPSBvYmplY3RDcmVhdGUobnVsbCk7XG4gICAgdGFyZ2V0Ll9ldmVudHNDb3VudCA9IDA7XG4gIH0gZWxzZSB7XG4gICAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gICAgaWYgKGV2ZW50cy5uZXdMaXN0ZW5lcikge1xuICAgICAgdGFyZ2V0LmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA/IGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gICAgICAvLyBSZS1hc3NpZ24gYGV2ZW50c2AgYmVjYXVzZSBhIG5ld0xpc3RlbmVyIGhhbmRsZXIgY291bGQgaGF2ZSBjYXVzZWQgdGhlXG4gICAgICAvLyB0aGlzLl9ldmVudHMgdG8gYmUgYXNzaWduZWQgdG8gYSBuZXcgb2JqZWN0XG4gICAgICBldmVudHMgPSB0YXJnZXQuX2V2ZW50cztcbiAgICB9XG4gICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV07XG4gIH1cblxuICBpZiAoIWV4aXN0aW5nKSB7XG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgICArK3RhcmdldC5fZXZlbnRzQ291bnQ7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHR5cGVvZiBleGlzdGluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgICBleGlzdGluZyA9IGV2ZW50c1t0eXBlXSA9XG4gICAgICAgICAgcHJlcGVuZCA/IFtsaXN0ZW5lciwgZXhpc3RpbmddIDogW2V4aXN0aW5nLCBsaXN0ZW5lcl07XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICAgIGlmIChwcmVwZW5kKSB7XG4gICAgICAgIGV4aXN0aW5nLnVuc2hpZnQobGlzdGVuZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXhpc3RpbmcucHVzaChsaXN0ZW5lcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBpZiAoIWV4aXN0aW5nLndhcm5lZCkge1xuICAgICAgbSA9ICRnZXRNYXhMaXN0ZW5lcnModGFyZ2V0KTtcbiAgICAgIGlmIChtICYmIG0gPiAwICYmIGV4aXN0aW5nLmxlbmd0aCA+IG0pIHtcbiAgICAgICAgZXhpc3Rpbmcud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIHcgPSBuZXcgRXJyb3IoJ1Bvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgbGVhayBkZXRlY3RlZC4gJyArXG4gICAgICAgICAgICBleGlzdGluZy5sZW5ndGggKyAnIFwiJyArIFN0cmluZyh0eXBlKSArICdcIiBsaXN0ZW5lcnMgJyArXG4gICAgICAgICAgICAnYWRkZWQuIFVzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvICcgK1xuICAgICAgICAgICAgJ2luY3JlYXNlIGxpbWl0LicpO1xuICAgICAgICB3Lm5hbWUgPSAnTWF4TGlzdGVuZXJzRXhjZWVkZWRXYXJuaW5nJztcbiAgICAgICAgdy5lbWl0dGVyID0gdGFyZ2V0O1xuICAgICAgICB3LnR5cGUgPSB0eXBlO1xuICAgICAgICB3LmNvdW50ID0gZXhpc3RpbmcubGVuZ3RoO1xuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT09ICdvYmplY3QnICYmIGNvbnNvbGUud2Fybikge1xuICAgICAgICAgIGNvbnNvbGUud2FybignJXM6ICVzJywgdy5uYW1lLCB3Lm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHJldHVybiBfYWRkTGlzdGVuZXIodGhpcywgdHlwZSwgbGlzdGVuZXIsIGZhbHNlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcHJlcGVuZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICByZXR1cm4gX2FkZExpc3RlbmVyKHRoaXMsIHR5cGUsIGxpc3RlbmVyLCB0cnVlKTtcbiAgICB9O1xuXG5mdW5jdGlvbiBvbmNlV3JhcHBlcigpIHtcbiAgaWYgKCF0aGlzLmZpcmVkKSB7XG4gICAgdGhpcy50YXJnZXQucmVtb3ZlTGlzdGVuZXIodGhpcy50eXBlLCB0aGlzLndyYXBGbik7XG4gICAgdGhpcy5maXJlZCA9IHRydWU7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyLmNhbGwodGhpcy50YXJnZXQpO1xuICAgICAgY2FzZSAxOlxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0LCBhcmd1bWVudHNbMF0pO1xuICAgICAgY2FzZSAyOlxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0LCBhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSk7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyLmNhbGwodGhpcy50YXJnZXQsIGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdLFxuICAgICAgICAgICAgYXJndW1lbnRzWzJdKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyArK2kpXG4gICAgICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5hcHBseSh0aGlzLnRhcmdldCwgYXJncyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIF9vbmNlV3JhcCh0YXJnZXQsIHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzdGF0ZSA9IHsgZmlyZWQ6IGZhbHNlLCB3cmFwRm46IHVuZGVmaW5lZCwgdGFyZ2V0OiB0YXJnZXQsIHR5cGU6IHR5cGUsIGxpc3RlbmVyOiBsaXN0ZW5lciB9O1xuICB2YXIgd3JhcHBlZCA9IGJpbmQuY2FsbChvbmNlV3JhcHBlciwgc3RhdGUpO1xuICB3cmFwcGVkLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHN0YXRlLndyYXBGbiA9IHdyYXBwZWQ7XG4gIHJldHVybiB3cmFwcGVkO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICB0aGlzLm9uKHR5cGUsIF9vbmNlV3JhcCh0aGlzLCB0eXBlLCBsaXN0ZW5lcikpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZE9uY2VMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcHJlcGVuZE9uY2VMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgICAgdGhpcy5wcmVwZW5kTGlzdGVuZXIodHlwZSwgX29uY2VXcmFwKHRoaXMsIHR5cGUsIGxpc3RlbmVyKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4vLyBFbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWYgYW5kIG9ubHkgaWYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBsaXN0LCBldmVudHMsIHBvc2l0aW9uLCBpLCBvcmlnaW5hbExpc3RlbmVyO1xuXG4gICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RlbmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgICAgIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcbiAgICAgIGlmICghZXZlbnRzKVxuICAgICAgICByZXR1cm4gdGhpcztcblxuICAgICAgbGlzdCA9IGV2ZW50c1t0eXBlXTtcbiAgICAgIGlmICghbGlzdClcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fCBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMClcbiAgICAgICAgICB0aGlzLl9ldmVudHMgPSBvYmplY3RDcmVhdGUobnVsbCk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGRlbGV0ZSBldmVudHNbdHlwZV07XG4gICAgICAgICAgaWYgKGV2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgICAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0Lmxpc3RlbmVyIHx8IGxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbGlzdCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBwb3NpdGlvbiA9IC0xO1xuXG4gICAgICAgIGZvciAoaSA9IGxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHwgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgICAgIG9yaWdpbmFsTGlzdGVuZXIgPSBsaXN0W2ldLmxpc3RlbmVyO1xuICAgICAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgICAgICByZXR1cm4gdGhpcztcblxuICAgICAgICBpZiAocG9zaXRpb24gPT09IDApXG4gICAgICAgICAgbGlzdC5zaGlmdCgpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgc3BsaWNlT25lKGxpc3QsIHBvc2l0aW9uKTtcblxuICAgICAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpXG4gICAgICAgICAgZXZlbnRzW3R5cGVdID0gbGlzdFswXTtcblxuICAgICAgICBpZiAoZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBvcmlnaW5hbExpc3RlbmVyIHx8IGxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxuICAgIGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyh0eXBlKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzLCBldmVudHMsIGk7XG5cbiAgICAgIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcbiAgICAgIGlmICghZXZlbnRzKVxuICAgICAgICByZXR1cm4gdGhpcztcblxuICAgICAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICAgICAgaWYgKCFldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHMgPSBvYmplY3RDcmVhdGUobnVsbCk7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50c1t0eXBlXSkge1xuICAgICAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKVxuICAgICAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGRlbGV0ZSBldmVudHNbdHlwZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdmFyIGtleXMgPSBvYmplY3RLZXlzKGV2ZW50cyk7XG4gICAgICAgIHZhciBrZXk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgICAgICB0aGlzLl9ldmVudHMgPSBvYmplY3RDcmVhdGUobnVsbCk7XG4gICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIGxpc3RlbmVycyA9IGV2ZW50c1t0eXBlXTtcblxuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICAgICAgfSBlbHNlIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAgICAgLy8gTElGTyBvcmRlclxuICAgICAgICBmb3IgKGkgPSBsaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnModHlwZSkge1xuICB2YXIgZXZsaXN0ZW5lcjtcbiAgdmFyIHJldDtcbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcblxuICBpZiAoIWV2ZW50cylcbiAgICByZXQgPSBbXTtcbiAgZWxzZSB7XG4gICAgZXZsaXN0ZW5lciA9IGV2ZW50c1t0eXBlXTtcbiAgICBpZiAoIWV2bGlzdGVuZXIpXG4gICAgICByZXQgPSBbXTtcbiAgICBlbHNlIGlmICh0eXBlb2YgZXZsaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldCA9IFtldmxpc3RlbmVyLmxpc3RlbmVyIHx8IGV2bGlzdGVuZXJdO1xuICAgIGVsc2VcbiAgICAgIHJldCA9IHVud3JhcExpc3RlbmVycyhldmxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgaWYgKHR5cGVvZiBlbWl0dGVyLmxpc3RlbmVyQ291bnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBsaXN0ZW5lckNvdW50LmNhbGwoZW1pdHRlciwgdHlwZSk7XG4gIH1cbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGxpc3RlbmVyQ291bnQ7XG5mdW5jdGlvbiBsaXN0ZW5lckNvdW50KHR5cGUpIHtcbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcblxuICBpZiAoZXZlbnRzKSB7XG4gICAgdmFyIGV2bGlzdGVuZXIgPSBldmVudHNbdHlwZV07XG5cbiAgICBpZiAodHlwZW9mIGV2bGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH0gZWxzZSBpZiAoZXZsaXN0ZW5lcikge1xuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAwO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICByZXR1cm4gdGhpcy5fZXZlbnRzQ291bnQgPiAwID8gUmVmbGVjdC5vd25LZXlzKHRoaXMuX2V2ZW50cykgOiBbXTtcbn07XG5cbi8vIEFib3V0IDEuNXggZmFzdGVyIHRoYW4gdGhlIHR3by1hcmcgdmVyc2lvbiBvZiBBcnJheSNzcGxpY2UoKS5cbmZ1bmN0aW9uIHNwbGljZU9uZShsaXN0LCBpbmRleCkge1xuICBmb3IgKHZhciBpID0gaW5kZXgsIGsgPSBpICsgMSwgbiA9IGxpc3QubGVuZ3RoOyBrIDwgbjsgaSArPSAxLCBrICs9IDEpXG4gICAgbGlzdFtpXSA9IGxpc3Rba107XG4gIGxpc3QucG9wKCk7XG59XG5cbmZ1bmN0aW9uIGFycmF5Q2xvbmUoYXJyLCBuKSB7XG4gIHZhciBjb3B5ID0gbmV3IEFycmF5KG4pO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSlcbiAgICBjb3B5W2ldID0gYXJyW2ldO1xuICByZXR1cm4gY29weTtcbn1cblxuZnVuY3Rpb24gdW53cmFwTGlzdGVuZXJzKGFycikge1xuICB2YXIgcmV0ID0gbmV3IEFycmF5KGFyci5sZW5ndGgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHJldC5sZW5ndGg7ICsraSkge1xuICAgIHJldFtpXSA9IGFycltpXS5saXN0ZW5lciB8fCBhcnJbaV07XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gb2JqZWN0Q3JlYXRlUG9seWZpbGwocHJvdG8pIHtcbiAgdmFyIEYgPSBmdW5jdGlvbigpIHt9O1xuICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICByZXR1cm4gbmV3IEY7XG59XG5mdW5jdGlvbiBvYmplY3RLZXlzUG9seWZpbGwob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGsgaW4gb2JqKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgaykpIHtcbiAgICBrZXlzLnB1c2goayk7XG4gIH1cbiAgcmV0dXJuIGs7XG59XG5mdW5jdGlvbiBmdW5jdGlvbkJpbmRQb2x5ZmlsbChjb250ZXh0KSB7XG4gIHZhciBmbiA9IHRoaXM7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gIH07XG59XG4iLCJ2YXIgaXNhcnJheSA9IHJlcXVpcmUoJ2lzYXJyYXknKTtcbnZhciBoYXNmID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbmZ1bmN0aW9uIGhhcyAob2JqLCBrZXkpIHsgcmV0dXJuIGhhc2YuY2FsbChvYmosa2V5KSB9XG5cbnZhciBWRVJTSU9OID0gJzEuMC4wJztcblxubW9kdWxlLmV4cG9ydHMgPSBSUEM7XG5cbmZ1bmN0aW9uIFJQQyAoc3JjLCBkc3QsIG9yaWdpbiwgbWV0aG9kcykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSUEMpKSByZXR1cm4gbmV3IFJQQyhzcmMsIGRzdCwgb3JpZ2luLCBtZXRob2RzKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5zcmMgPSBzcmM7XG4gICAgdGhpcy5kc3QgPSBkc3Q7XG4gICAgdGhpcy5fZHN0SXNXb3JrZXIgPSAvV29ya2VyLy50ZXN0KGRzdCk7XG4gICAgXG4gICAgaWYgKG9yaWdpbiA9PT0gJyonKSB7XG4gICAgICAgIHRoaXMub3JpZ2luID0gJyonO1xuICAgIH1cbiAgICBlbHNlIGlmIChvcmlnaW4pIHtcbiAgICAgICAgdmFyIHVvcmlnaW4gPSBuZXcgVVJMKG9yaWdpbik7XG4gICAgICAgIHRoaXMub3JpZ2luID0gdW9yaWdpbi5wcm90b2NvbCArICcvLycgKyB1b3JpZ2luLmhvc3Q7XG4gICAgfVxuICAgIFxuICAgIHRoaXMuX3NlcXVlbmNlID0gMDtcbiAgICB0aGlzLl9jYWxsYmFja3MgPSB7fTtcbiAgICBcbiAgICB0aGlzLl9vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgaWYgKHNlbGYuX2Rlc3Ryb3llZCkgcmV0dXJuO1xuICAgICAgICBpZiAoc2VsZi5vcmlnaW4gIT09ICcqJyAmJiBldi5vcmlnaW4gIT09IHNlbGYub3JpZ2luKSByZXR1cm47XG4gICAgICAgIGlmICghZXYuZGF0YSB8fCB0eXBlb2YgZXYuZGF0YSAhPT0gJ29iamVjdCcpIHJldHVybjtcbiAgICAgICAgaWYgKGV2LmRhdGEucHJvdG9jb2wgIT09ICdmcmFtZS1ycGMnKSByZXR1cm47XG4gICAgICAgIGlmICghaXNhcnJheShldi5kYXRhLmFyZ3VtZW50cykpIHJldHVybjtcbiAgICAgICAgc2VsZi5faGFuZGxlKGV2LmRhdGEpO1xuICAgIH07XG4gICAgdGhpcy5zcmMuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMuX29ubWVzc2FnZSk7XG4gICAgdGhpcy5fbWV0aG9kcyA9ICh0eXBlb2YgbWV0aG9kcyA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICA/IG1ldGhvZHModGhpcylcbiAgICAgICAgOiBtZXRob2RzXG4gICAgKSB8fCB7fTtcbn1cblxuUlBDLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG4gICAgdGhpcy5zcmMucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMuX29ubWVzc2FnZSk7XG59O1xuXG5SUEMucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIHRoaXMuYXBwbHkobWV0aG9kLCBhcmdzKTtcbn07XG5cblJQQy5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbiAobWV0aG9kLCBhcmdzKSB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkgcmV0dXJuO1xuICAgIHZhciBzZXEgPSB0aGlzLl9zZXF1ZW5jZSArKztcbiAgICBpZiAodHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLl9jYWxsYmFja3Nbc2VxXSA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgYXJncyA9IGFyZ3Muc2xpY2UoMCwgLTEpO1xuICAgIH1cbiAgICB0aGlzLl9kc3RQb3N0TWVzc2FnZSh7XG4gICAgICAgIHByb3RvY29sOiAnZnJhbWUtcnBjJyxcbiAgICAgICAgdmVyc2lvbjogVkVSU0lPTixcbiAgICAgICAgc2VxdWVuY2U6IHNlcSxcbiAgICAgICAgbWV0aG9kOiBtZXRob2QsIFxuICAgICAgICBhcmd1bWVudHM6IGFyZ3NcbiAgICB9KTtcbn07XG5cblJQQy5wcm90b3R5cGUuX2RzdFBvc3RNZXNzYWdlID0gZnVuY3Rpb24gKG1zZykge1xuICAgIGlmICh0aGlzLl9kc3RJc1dvcmtlcikge1xuICAgICAgICB0aGlzLmRzdC5wb3N0TWVzc2FnZShtc2cpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5kc3QucG9zdE1lc3NhZ2UobXNnLCB0aGlzLm9yaWdpbik7XG4gICAgfVxufTtcblxuUlBDLnByb3RvdHlwZS5faGFuZGxlID0gZnVuY3Rpb24gKG1zZykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoc2VsZi5fZGVzdHJveWVkKSByZXR1cm47XG4gICAgaWYgKGhhcyhtc2csICdtZXRob2QnKSkge1xuICAgICAgICBpZiAoIWhhcyh0aGlzLl9tZXRob2RzLCBtc2cubWV0aG9kKSkgcmV0dXJuO1xuICAgICAgICB2YXIgYXJncyA9IG1zZy5hcmd1bWVudHMuY29uY2F0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuX2RzdFBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICBwcm90b2NvbDogJ2ZyYW1lLXJwYycsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogVkVSU0lPTixcbiAgICAgICAgICAgICAgICByZXNwb25zZTogbXNnLnNlcXVlbmNlLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW10uc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX21ldGhvZHNbbXNnLm1ldGhvZF0uYXBwbHkodGhpcy5fbWV0aG9kcywgYXJncyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGhhcyhtc2csICdyZXNwb25zZScpKSB7XG4gICAgICAgIHZhciBjYiA9IHRoaXMuX2NhbGxiYWNrc1ttc2cucmVzcG9uc2VdO1xuICAgICAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzW21zZy5yZXNwb25zZV07XG4gICAgICAgIGlmIChjYikgY2IuYXBwbHkobnVsbCwgbXNnLmFyZ3VtZW50cyk7XG4gICAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXJyKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gKGUgKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gKG0gKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAoKHZhbHVlICogYykgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLyohXG4gKiBEZXRlcm1pbmUgaWYgYW4gb2JqZWN0IGlzIGEgQnVmZmVyXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuXG4vLyBUaGUgX2lzQnVmZmVyIGNoZWNrIGlzIGZvciBTYWZhcmkgNS03IHN1cHBvcnQsIGJlY2F1c2UgaXQncyBtaXNzaW5nXG4vLyBPYmplY3QucHJvdG90eXBlLmNvbnN0cnVjdG9yLiBSZW1vdmUgdGhpcyBldmVudHVhbGx5XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAhPSBudWxsICYmIChpc0J1ZmZlcihvYmopIHx8IGlzU2xvd0J1ZmZlcihvYmopIHx8ICEhb2JqLl9pc0J1ZmZlcilcbn1cblxuZnVuY3Rpb24gaXNCdWZmZXIgKG9iaikge1xuICByZXR1cm4gISFvYmouY29uc3RydWN0b3IgJiYgdHlwZW9mIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlciA9PT0gJ2Z1bmN0aW9uJyAmJiBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIob2JqKVxufVxuXG4vLyBGb3IgTm9kZSB2MC4xMCBzdXBwb3J0LiBSZW1vdmUgdGhpcyBldmVudHVhbGx5LlxuZnVuY3Rpb24gaXNTbG93QnVmZmVyIChvYmopIHtcbiAgcmV0dXJuIHR5cGVvZiBvYmoucmVhZEZsb2F0TEUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIG9iai5zbGljZSA9PT0gJ2Z1bmN0aW9uJyAmJiBpc0J1ZmZlcihvYmouc2xpY2UoMCwgMCkpXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjYWxsYWJsZSwgYnlPYnNlcnZlcjtcblxuY2FsbGFibGUgPSBmdW5jdGlvbiAoZm4pIHtcblx0aWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykgdGhyb3cgbmV3IFR5cGVFcnJvcihmbiArIFwiIGlzIG5vdCBhIGZ1bmN0aW9uXCIpO1xuXHRyZXR1cm4gZm47XG59O1xuXG5ieU9ic2VydmVyID0gZnVuY3Rpb24gKE9ic2VydmVyKSB7XG5cdHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpLCBxdWV1ZSwgY3VycmVudFF1ZXVlLCBpID0gMDtcblx0bmV3IE9ic2VydmVyKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY2FsbGJhY2s7XG5cdFx0aWYgKCFxdWV1ZSkge1xuXHRcdFx0aWYgKCFjdXJyZW50UXVldWUpIHJldHVybjtcblx0XHRcdHF1ZXVlID0gY3VycmVudFF1ZXVlO1xuXHRcdH0gZWxzZSBpZiAoY3VycmVudFF1ZXVlKSB7XG5cdFx0XHRxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuXHRcdH1cblx0XHRjdXJyZW50UXVldWUgPSBxdWV1ZTtcblx0XHRxdWV1ZSA9IG51bGw7XG5cdFx0aWYgKHR5cGVvZiBjdXJyZW50UXVldWUgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdGNhbGxiYWNrID0gY3VycmVudFF1ZXVlO1xuXHRcdFx0Y3VycmVudFF1ZXVlID0gbnVsbDtcblx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdG5vZGUuZGF0YSA9IChpID0gKytpICUgMik7IC8vIEludm9rZSBvdGhlciBiYXRjaCwgdG8gaGFuZGxlIGxlZnRvdmVyIGNhbGxiYWNrcyBpbiBjYXNlIG9mIGNyYXNoXG5cdFx0d2hpbGUgKGN1cnJlbnRRdWV1ZSkge1xuXHRcdFx0Y2FsbGJhY2sgPSBjdXJyZW50UXVldWUuc2hpZnQoKTtcblx0XHRcdGlmICghY3VycmVudFF1ZXVlLmxlbmd0aCkgY3VycmVudFF1ZXVlID0gbnVsbDtcblx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0fVxuXHR9KS5vYnNlcnZlKG5vZGUsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcblx0cmV0dXJuIGZ1bmN0aW9uIChmbikge1xuXHRcdGNhbGxhYmxlKGZuKTtcblx0XHRpZiAocXVldWUpIHtcblx0XHRcdGlmICh0eXBlb2YgcXVldWUgPT09ICdmdW5jdGlvbicpIHF1ZXVlID0gW3F1ZXVlLCBmbl07XG5cdFx0XHRlbHNlIHF1ZXVlLnB1c2goZm4pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRxdWV1ZSA9IGZuO1xuXHRcdG5vZGUuZGF0YSA9IChpID0gKytpICUgMik7XG5cdH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG5cdC8vIE5vZGUuanNcblx0aWYgKCh0eXBlb2YgcHJvY2VzcyA9PT0gJ29iamVjdCcpICYmIHByb2Nlc3MgJiYgKHR5cGVvZiBwcm9jZXNzLm5leHRUaWNrID09PSAnZnVuY3Rpb24nKSkge1xuXHRcdHJldHVybiBwcm9jZXNzLm5leHRUaWNrO1xuXHR9XG5cblx0Ly8gTXV0YXRpb25PYnNlcnZlclxuXHRpZiAoKHR5cGVvZiBkb2N1bWVudCA9PT0gJ29iamVjdCcpICYmIGRvY3VtZW50KSB7XG5cdFx0aWYgKHR5cGVvZiBNdXRhdGlvbk9ic2VydmVyID09PSAnZnVuY3Rpb24nKSByZXR1cm4gYnlPYnNlcnZlcihNdXRhdGlvbk9ic2VydmVyKTtcblx0XHRpZiAodHlwZW9mIFdlYktpdE11dGF0aW9uT2JzZXJ2ZXIgPT09ICdmdW5jdGlvbicpIHJldHVybiBieU9ic2VydmVyKFdlYktpdE11dGF0aW9uT2JzZXJ2ZXIpO1xuXHR9XG5cblx0Ly8gVzNDIERyYWZ0XG5cdC8vIGh0dHA6Ly9kdmNzLnczLm9yZy9oZy93ZWJwZXJmL3Jhdy1maWxlL3RpcC9zcGVjcy9zZXRJbW1lZGlhdGUvT3ZlcnZpZXcuaHRtbFxuXHRpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBmdW5jdGlvbiAoY2IpIHsgc2V0SW1tZWRpYXRlKGNhbGxhYmxlKGNiKSk7IH07XG5cdH1cblxuXHQvLyBXaWRlIGF2YWlsYWJsZSBzdGFuZGFyZFxuXHRpZiAoKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB8fCAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdvYmplY3QnKSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAoY2IpIHsgc2V0VGltZW91dChjYWxsYWJsZShjYiksIDApOyB9O1xuXHR9XG5cblx0cmV0dXJuIG51bGw7XG59KCkpO1xuIiwidmFyIHdyYXBweSA9IHJlcXVpcmUoJ3dyYXBweScpXG5tb2R1bGUuZXhwb3J0cyA9IHdyYXBweShvbmNlKVxubW9kdWxlLmV4cG9ydHMuc3RyaWN0ID0gd3JhcHB5KG9uY2VTdHJpY3QpXG5cbm9uY2UucHJvdG8gPSBvbmNlKGZ1bmN0aW9uICgpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEZ1bmN0aW9uLnByb3RvdHlwZSwgJ29uY2UnLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBvbmNlKHRoaXMpXG4gICAgfSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSlcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRnVuY3Rpb24ucHJvdG90eXBlLCAnb25jZVN0cmljdCcsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIG9uY2VTdHJpY3QodGhpcylcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9KVxufSlcblxuZnVuY3Rpb24gb25jZSAoZm4pIHtcbiAgdmFyIGYgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGYuY2FsbGVkKSByZXR1cm4gZi52YWx1ZVxuICAgIGYuY2FsbGVkID0gdHJ1ZVxuICAgIHJldHVybiBmLnZhbHVlID0gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG4gIGYuY2FsbGVkID0gZmFsc2VcbiAgcmV0dXJuIGZcbn1cblxuZnVuY3Rpb24gb25jZVN0cmljdCAoZm4pIHtcbiAgdmFyIGYgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGYuY2FsbGVkKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGYub25jZUVycm9yKVxuICAgIGYuY2FsbGVkID0gdHJ1ZVxuICAgIHJldHVybiBmLnZhbHVlID0gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG4gIHZhciBuYW1lID0gZm4ubmFtZSB8fCAnRnVuY3Rpb24gd3JhcHBlZCB3aXRoIGBvbmNlYCdcbiAgZi5vbmNlRXJyb3IgPSBuYW1lICsgXCIgc2hvdWxkbid0IGJlIGNhbGxlZCBtb3JlIHRoYW4gb25jZVwiXG4gIGYuY2FsbGVkID0gZmFsc2VcbiAgcmV0dXJuIGZcbn1cbiIsInZhciB2YXJpbnQgPSByZXF1aXJlKCd2YXJpbnQnKVxudmFyIHN2YXJpbnQgPSByZXF1aXJlKCdzaWduZWQtdmFyaW50JylcblxuZXhwb3J0cy5tYWtlID0gZW5jb2RlclxuXG5leHBvcnRzLm5hbWUgPSBmdW5jdGlvbiAoZW5jKSB7XG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoZXhwb3J0cylcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHNba2V5c1tpXV0gPT09IGVuYykgcmV0dXJuIGtleXNbaV1cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG5leHBvcnRzLnNraXAgPSBmdW5jdGlvbiAodHlwZSwgYnVmZmVyLCBvZmZzZXQpIHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAwOlxuICAgICAgdmFyaW50LmRlY29kZShidWZmZXIsIG9mZnNldClcbiAgICAgIHJldHVybiBvZmZzZXQgKyB2YXJpbnQuZGVjb2RlLmJ5dGVzXG5cbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gb2Zmc2V0ICsgOFxuXG4gICAgY2FzZSAyOlxuICAgICAgdmFyIGxlbiA9IHZhcmludC5kZWNvZGUoYnVmZmVyLCBvZmZzZXQpXG4gICAgICByZXR1cm4gb2Zmc2V0ICsgdmFyaW50LmRlY29kZS5ieXRlcyArIGxlblxuXG4gICAgY2FzZSAzOlxuICAgIGNhc2UgNDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignR3JvdXBzIGFyZSBub3Qgc3VwcG9ydGVkJylcblxuICAgIGNhc2UgNTpcbiAgICAgIHJldHVybiBvZmZzZXQgKyA0XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gd2lyZSB0eXBlOiAnICsgdHlwZSlcbn1cblxuZXhwb3J0cy5ieXRlcyA9IGVuY29kZXIoMixcbiAgZnVuY3Rpb24gZW5jb2RlICh2YWwsIGJ1ZmZlciwgb2Zmc2V0KSB7XG4gICAgdmFyIG9sZE9mZnNldCA9IG9mZnNldFxuICAgIHZhciBsZW4gPSBidWZmZXJMZW5ndGgodmFsKVxuXG4gICAgdmFyaW50LmVuY29kZShsZW4sIGJ1ZmZlciwgb2Zmc2V0KVxuICAgIG9mZnNldCArPSB2YXJpbnQuZW5jb2RlLmJ5dGVzXG5cbiAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbCkpIHZhbC5jb3B5KGJ1ZmZlciwgb2Zmc2V0KVxuICAgIGVsc2UgYnVmZmVyLndyaXRlKHZhbCwgb2Zmc2V0LCBsZW4pXG4gICAgb2Zmc2V0ICs9IGxlblxuXG4gICAgZW5jb2RlLmJ5dGVzID0gb2Zmc2V0IC0gb2xkT2Zmc2V0XG4gICAgcmV0dXJuIGJ1ZmZlclxuICB9LFxuICBmdW5jdGlvbiBkZWNvZGUgKGJ1ZmZlciwgb2Zmc2V0KSB7XG4gICAgdmFyIG9sZE9mZnNldCA9IG9mZnNldFxuXG4gICAgdmFyIGxlbiA9IHZhcmludC5kZWNvZGUoYnVmZmVyLCBvZmZzZXQpXG4gICAgb2Zmc2V0ICs9IHZhcmludC5kZWNvZGUuYnl0ZXNcblxuICAgIHZhciB2YWwgPSBidWZmZXIuc2xpY2Uob2Zmc2V0LCBvZmZzZXQgKyBsZW4pXG4gICAgb2Zmc2V0ICs9IHZhbC5sZW5ndGhcblxuICAgIGRlY29kZS5ieXRlcyA9IG9mZnNldCAtIG9sZE9mZnNldFxuICAgIHJldHVybiB2YWxcbiAgfSxcbiAgZnVuY3Rpb24gZW5jb2RpbmdMZW5ndGggKHZhbCkge1xuICAgIHZhciBsZW4gPSBidWZmZXJMZW5ndGgodmFsKVxuICAgIHJldHVybiB2YXJpbnQuZW5jb2RpbmdMZW5ndGgobGVuKSArIGxlblxuICB9XG4pXG5cbmV4cG9ydHMuc3RyaW5nID0gZW5jb2RlcigyLFxuICBmdW5jdGlvbiBlbmNvZGUgKHZhbCwgYnVmZmVyLCBvZmZzZXQpIHtcbiAgICB2YXIgb2xkT2Zmc2V0ID0gb2Zmc2V0XG4gICAgdmFyIGxlbiA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHZhbClcblxuICAgIHZhcmludC5lbmNvZGUobGVuLCBidWZmZXIsIG9mZnNldCwgJ3V0Zi04JylcbiAgICBvZmZzZXQgKz0gdmFyaW50LmVuY29kZS5ieXRlc1xuXG4gICAgYnVmZmVyLndyaXRlKHZhbCwgb2Zmc2V0LCBsZW4pXG4gICAgb2Zmc2V0ICs9IGxlblxuXG4gICAgZW5jb2RlLmJ5dGVzID0gb2Zmc2V0IC0gb2xkT2Zmc2V0XG4gICAgcmV0dXJuIGJ1ZmZlclxuICB9LFxuICBmdW5jdGlvbiBkZWNvZGUgKGJ1ZmZlciwgb2Zmc2V0KSB7XG4gICAgdmFyIG9sZE9mZnNldCA9IG9mZnNldFxuXG4gICAgdmFyIGxlbiA9IHZhcmludC5kZWNvZGUoYnVmZmVyLCBvZmZzZXQpXG4gICAgb2Zmc2V0ICs9IHZhcmludC5kZWNvZGUuYnl0ZXNcblxuICAgIHZhciB2YWwgPSBidWZmZXIudG9TdHJpbmcoJ3V0Zi04Jywgb2Zmc2V0LCBvZmZzZXQgKyBsZW4pXG4gICAgb2Zmc2V0ICs9IGxlblxuXG4gICAgZGVjb2RlLmJ5dGVzID0gb2Zmc2V0IC0gb2xkT2Zmc2V0XG4gICAgcmV0dXJuIHZhbFxuICB9LFxuICBmdW5jdGlvbiBlbmNvZGluZ0xlbmd0aCAodmFsKSB7XG4gICAgdmFyIGxlbiA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHZhbClcbiAgICByZXR1cm4gdmFyaW50LmVuY29kaW5nTGVuZ3RoKGxlbikgKyBsZW5cbiAgfVxuKVxuXG5leHBvcnRzLmJvb2wgPSBlbmNvZGVyKDAsXG4gIGZ1bmN0aW9uIGVuY29kZSAodmFsLCBidWZmZXIsIG9mZnNldCkge1xuICAgIGJ1ZmZlcltvZmZzZXRdID0gdmFsID8gMSA6IDBcbiAgICBlbmNvZGUuYnl0ZXMgPSAxXG4gICAgcmV0dXJuIGJ1ZmZlclxuICB9LFxuICBmdW5jdGlvbiBkZWNvZGUgKGJ1ZmZlciwgb2Zmc2V0KSB7XG4gICAgdmFyIGJvb2wgPSBidWZmZXJbb2Zmc2V0XSA+IDBcbiAgICBkZWNvZGUuYnl0ZXMgPSAxXG4gICAgcmV0dXJuIGJvb2xcbiAgfSxcbiAgZnVuY3Rpb24gZW5jb2RpbmdMZW5ndGggKCkge1xuICAgIHJldHVybiAxXG4gIH1cbilcblxuZXhwb3J0cy5pbnQzMiA9IGVuY29kZXIoMCxcbiAgZnVuY3Rpb24gZW5jb2RlICh2YWwsIGJ1ZmZlciwgb2Zmc2V0KSB7XG4gICAgdmFyaW50LmVuY29kZSh2YWwgPCAwID8gdmFsICsgNDI5NDk2NzI5NiA6IHZhbCwgYnVmZmVyLCBvZmZzZXQpXG4gICAgZW5jb2RlLmJ5dGVzID0gdmFyaW50LmVuY29kZS5ieXRlc1xuICAgIHJldHVybiBidWZmZXJcbiAgfSxcbiAgZnVuY3Rpb24gZGVjb2RlIChidWZmZXIsIG9mZnNldCkge1xuICAgIHZhciB2YWwgPSB2YXJpbnQuZGVjb2RlKGJ1ZmZlciwgb2Zmc2V0KVxuICAgIGRlY29kZS5ieXRlcyA9IHZhcmludC5kZWNvZGUuYnl0ZXNcbiAgICByZXR1cm4gdmFsID4gMjE0NzQ4MzY0NyA/IHZhbCAtIDQyOTQ5NjcyOTYgOiB2YWxcbiAgfSxcbiAgZnVuY3Rpb24gZW5jb2RpbmdMZW5ndGggKHZhbCkge1xuICAgIHJldHVybiB2YXJpbnQuZW5jb2RpbmdMZW5ndGgodmFsIDwgMCA/IHZhbCArIDQyOTQ5NjcyOTYgOiB2YWwpXG4gIH1cbilcblxuZXhwb3J0cy5pbnQ2NCA9IGVuY29kZXIoMCxcbiAgZnVuY3Rpb24gZW5jb2RlICh2YWwsIGJ1ZmZlciwgb2Zmc2V0KSB7XG4gICAgaWYgKHZhbCA8IDApIHtcbiAgICAgIHZhciBsYXN0ID0gb2Zmc2V0ICsgOVxuICAgICAgdmFyaW50LmVuY29kZSh2YWwgKiAtMSwgYnVmZmVyLCBvZmZzZXQpXG4gICAgICBvZmZzZXQgKz0gdmFyaW50LmVuY29kZS5ieXRlcyAtIDFcbiAgICAgIGJ1ZmZlcltvZmZzZXRdID0gYnVmZmVyW29mZnNldF0gfCAweDgwXG4gICAgICB3aGlsZSAob2Zmc2V0IDwgbGFzdCAtIDEpIHtcbiAgICAgICAgb2Zmc2V0KytcbiAgICAgICAgYnVmZmVyW29mZnNldF0gPSAweGZmXG4gICAgICB9XG4gICAgICBidWZmZXJbbGFzdF0gPSAweDAxXG4gICAgICBlbmNvZGUuYnl0ZXMgPSAxMFxuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpbnQuZW5jb2RlKHZhbCwgYnVmZmVyLCBvZmZzZXQpXG4gICAgICBlbmNvZGUuYnl0ZXMgPSB2YXJpbnQuZW5jb2RlLmJ5dGVzXG4gICAgfVxuICAgIHJldHVybiBidWZmZXJcbiAgfSxcbiAgZnVuY3Rpb24gZGVjb2RlIChidWZmZXIsIG9mZnNldCkge1xuICAgIHZhciB2YWwgPSB2YXJpbnQuZGVjb2RlKGJ1ZmZlciwgb2Zmc2V0KVxuICAgIGlmICh2YWwgPj0gTWF0aC5wb3coMiwgNjMpKSB7XG4gICAgICB2YXIgbGltaXQgPSA5XG4gICAgICB3aGlsZSAoYnVmZmVyW29mZnNldCArIGxpbWl0IC0gMV0gPT09IDB4ZmYpIGxpbWl0LS1cbiAgICAgIGxpbWl0ID0gbGltaXQgfHwgOVxuICAgICAgdmFyIHN1YnNldCA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShsaW1pdClcbiAgICAgIGJ1ZmZlci5jb3B5KHN1YnNldCwgMCwgb2Zmc2V0LCBvZmZzZXQgKyBsaW1pdClcbiAgICAgIHN1YnNldFtsaW1pdCAtIDFdID0gc3Vic2V0W2xpbWl0IC0gMV0gJiAweDdmXG4gICAgICB2YWwgPSAtMSAqIHZhcmludC5kZWNvZGUoc3Vic2V0LCAwKVxuICAgICAgZGVjb2RlLmJ5dGVzID0gMTBcbiAgICB9IGVsc2Uge1xuICAgICAgZGVjb2RlLmJ5dGVzID0gdmFyaW50LmRlY29kZS5ieXRlc1xuICAgIH1cbiAgICByZXR1cm4gdmFsXG4gIH0sXG4gIGZ1bmN0aW9uIGVuY29kaW5nTGVuZ3RoICh2YWwpIHtcbiAgICByZXR1cm4gdmFsIDwgMCA/IDEwIDogdmFyaW50LmVuY29kaW5nTGVuZ3RoKHZhbClcbiAgfVxuKVxuXG5leHBvcnRzLnNpbnQzMiA9XG5leHBvcnRzLnNpbnQ2NCA9IGVuY29kZXIoMCxcbiAgc3ZhcmludC5lbmNvZGUsXG4gIHN2YXJpbnQuZGVjb2RlLFxuICBzdmFyaW50LmVuY29kaW5nTGVuZ3RoXG4pXG5cbmV4cG9ydHMudWludDMyID1cbmV4cG9ydHMudWludDY0ID1cbmV4cG9ydHMuZW51bSA9XG5leHBvcnRzLnZhcmludCA9IGVuY29kZXIoMCxcbiAgdmFyaW50LmVuY29kZSxcbiAgdmFyaW50LmRlY29kZSxcbiAgdmFyaW50LmVuY29kaW5nTGVuZ3RoXG4pXG5cbi8vIHdlIGNhbm5vdCByZXByZXNlbnQgdGhlc2UgaW4gamF2YXNjcmlwdCBzbyB3ZSBqdXN0IHVzZSBidWZmZXJzXG5leHBvcnRzLmZpeGVkNjQgPVxuZXhwb3J0cy5zZml4ZWQ2NCA9IGVuY29kZXIoMSxcbiAgZnVuY3Rpb24gZW5jb2RlICh2YWwsIGJ1ZmZlciwgb2Zmc2V0KSB7XG4gICAgdmFsLmNvcHkoYnVmZmVyLCBvZmZzZXQpXG4gICAgZW5jb2RlLmJ5dGVzID0gOFxuICAgIHJldHVybiBidWZmZXJcbiAgfSxcbiAgZnVuY3Rpb24gZGVjb2RlIChidWZmZXIsIG9mZnNldCkge1xuICAgIHZhciB2YWwgPSBidWZmZXIuc2xpY2Uob2Zmc2V0LCBvZmZzZXQgKyA4KVxuICAgIGRlY29kZS5ieXRlcyA9IDhcbiAgICByZXR1cm4gdmFsXG4gIH0sXG4gIGZ1bmN0aW9uIGVuY29kaW5nTGVuZ3RoICgpIHtcbiAgICByZXR1cm4gOFxuICB9XG4pXG5cbmV4cG9ydHMuZG91YmxlID0gZW5jb2RlcigxLFxuICBmdW5jdGlvbiBlbmNvZGUgKHZhbCwgYnVmZmVyLCBvZmZzZXQpIHtcbiAgICBidWZmZXIud3JpdGVEb3VibGVMRSh2YWwsIG9mZnNldClcbiAgICBlbmNvZGUuYnl0ZXMgPSA4XG4gICAgcmV0dXJuIGJ1ZmZlclxuICB9LFxuICBmdW5jdGlvbiBkZWNvZGUgKGJ1ZmZlciwgb2Zmc2V0KSB7XG4gICAgdmFyIHZhbCA9IGJ1ZmZlci5yZWFkRG91YmxlTEUob2Zmc2V0KVxuICAgIGRlY29kZS5ieXRlcyA9IDhcbiAgICByZXR1cm4gdmFsXG4gIH0sXG4gIGZ1bmN0aW9uIGVuY29kaW5nTGVuZ3RoICgpIHtcbiAgICByZXR1cm4gOFxuICB9XG4pXG5cbmV4cG9ydHMuZml4ZWQzMiA9IGVuY29kZXIoNSxcbiAgZnVuY3Rpb24gZW5jb2RlICh2YWwsIGJ1ZmZlciwgb2Zmc2V0KSB7XG4gICAgYnVmZmVyLndyaXRlVUludDMyTEUodmFsLCBvZmZzZXQpXG4gICAgZW5jb2RlLmJ5dGVzID0gNFxuICAgIHJldHVybiBidWZmZXJcbiAgfSxcbiAgZnVuY3Rpb24gZGVjb2RlIChidWZmZXIsIG9mZnNldCkge1xuICAgIHZhciB2YWwgPSBidWZmZXIucmVhZFVJbnQzMkxFKG9mZnNldClcbiAgICBkZWNvZGUuYnl0ZXMgPSA0XG4gICAgcmV0dXJuIHZhbFxuICB9LFxuICBmdW5jdGlvbiBlbmNvZGluZ0xlbmd0aCAoKSB7XG4gICAgcmV0dXJuIDRcbiAgfVxuKVxuXG5leHBvcnRzLnNmaXhlZDMyID0gZW5jb2Rlcig1LFxuICBmdW5jdGlvbiBlbmNvZGUgKHZhbCwgYnVmZmVyLCBvZmZzZXQpIHtcbiAgICBidWZmZXIud3JpdGVJbnQzMkxFKHZhbCwgb2Zmc2V0KVxuICAgIGVuY29kZS5ieXRlcyA9IDRcbiAgICByZXR1cm4gYnVmZmVyXG4gIH0sXG4gIGZ1bmN0aW9uIGRlY29kZSAoYnVmZmVyLCBvZmZzZXQpIHtcbiAgICB2YXIgdmFsID0gYnVmZmVyLnJlYWRJbnQzMkxFKG9mZnNldClcbiAgICBkZWNvZGUuYnl0ZXMgPSA0XG4gICAgcmV0dXJuIHZhbFxuICB9LFxuICBmdW5jdGlvbiBlbmNvZGluZ0xlbmd0aCAoKSB7XG4gICAgcmV0dXJuIDRcbiAgfVxuKVxuXG5leHBvcnRzLmZsb2F0ID0gZW5jb2Rlcig1LFxuICBmdW5jdGlvbiBlbmNvZGUgKHZhbCwgYnVmZmVyLCBvZmZzZXQpIHtcbiAgICBidWZmZXIud3JpdGVGbG9hdExFKHZhbCwgb2Zmc2V0KVxuICAgIGVuY29kZS5ieXRlcyA9IDRcbiAgICByZXR1cm4gYnVmZmVyXG4gIH0sXG4gIGZ1bmN0aW9uIGRlY29kZSAoYnVmZmVyLCBvZmZzZXQpIHtcbiAgICB2YXIgdmFsID0gYnVmZmVyLnJlYWRGbG9hdExFKG9mZnNldClcbiAgICBkZWNvZGUuYnl0ZXMgPSA0XG4gICAgcmV0dXJuIHZhbFxuICB9LFxuICBmdW5jdGlvbiBlbmNvZGluZ0xlbmd0aCAoKSB7XG4gICAgcmV0dXJuIDRcbiAgfVxuKVxuXG5mdW5jdGlvbiBlbmNvZGVyICh0eXBlLCBlbmNvZGUsIGRlY29kZSwgZW5jb2RpbmdMZW5ndGgpIHtcbiAgZW5jb2RlLmJ5dGVzID0gZGVjb2RlLmJ5dGVzID0gMFxuXG4gIHJldHVybiB7XG4gICAgdHlwZTogdHlwZSxcbiAgICBlbmNvZGU6IGVuY29kZSxcbiAgICBkZWNvZGU6IGRlY29kZSxcbiAgICBlbmNvZGluZ0xlbmd0aDogZW5jb2RpbmdMZW5ndGhcbiAgfVxufVxuXG5mdW5jdGlvbiBidWZmZXJMZW5ndGggKHZhbCkge1xuICByZXR1cm4gQnVmZmVyLmlzQnVmZmVyKHZhbCkgPyB2YWwubGVuZ3RoIDogQnVmZmVyLmJ5dGVMZW5ndGgodmFsKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSByZWFkXG5cbnZhciBNU0IgPSAweDgwXG4gICwgUkVTVCA9IDB4N0ZcblxuZnVuY3Rpb24gcmVhZChidWYsIG9mZnNldCkge1xuICB2YXIgcmVzICAgID0gMFxuICAgICwgb2Zmc2V0ID0gb2Zmc2V0IHx8IDBcbiAgICAsIHNoaWZ0ICA9IDBcbiAgICAsIGNvdW50ZXIgPSBvZmZzZXRcbiAgICAsIGJcbiAgICAsIGwgPSBidWYubGVuZ3RoXG5cbiAgZG8ge1xuICAgIGlmIChjb3VudGVyID49IGwpIHtcbiAgICAgIHJlYWQuYnl0ZXMgPSAwXG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQ291bGQgbm90IGRlY29kZSB2YXJpbnQnKVxuICAgIH1cbiAgICBiID0gYnVmW2NvdW50ZXIrK11cbiAgICByZXMgKz0gc2hpZnQgPCAyOFxuICAgICAgPyAoYiAmIFJFU1QpIDw8IHNoaWZ0XG4gICAgICA6IChiICYgUkVTVCkgKiBNYXRoLnBvdygyLCBzaGlmdClcbiAgICBzaGlmdCArPSA3XG4gIH0gd2hpbGUgKGIgPj0gTVNCKVxuXG4gIHJlYWQuYnl0ZXMgPSBjb3VudGVyIC0gb2Zmc2V0XG5cbiAgcmV0dXJuIHJlc1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBlbmNvZGVcblxudmFyIE1TQiA9IDB4ODBcbiAgLCBSRVNUID0gMHg3RlxuICAsIE1TQkFMTCA9IH5SRVNUXG4gICwgSU5UID0gTWF0aC5wb3coMiwgMzEpXG5cbmZ1bmN0aW9uIGVuY29kZShudW0sIG91dCwgb2Zmc2V0KSB7XG4gIG91dCA9IG91dCB8fCBbXVxuICBvZmZzZXQgPSBvZmZzZXQgfHwgMFxuICB2YXIgb2xkT2Zmc2V0ID0gb2Zmc2V0XG5cbiAgd2hpbGUobnVtID49IElOVCkge1xuICAgIG91dFtvZmZzZXQrK10gPSAobnVtICYgMHhGRikgfCBNU0JcbiAgICBudW0gLz0gMTI4XG4gIH1cbiAgd2hpbGUobnVtICYgTVNCQUxMKSB7XG4gICAgb3V0W29mZnNldCsrXSA9IChudW0gJiAweEZGKSB8IE1TQlxuICAgIG51bSA+Pj49IDdcbiAgfVxuICBvdXRbb2Zmc2V0XSA9IG51bSB8IDBcbiAgXG4gIGVuY29kZS5ieXRlcyA9IG9mZnNldCAtIG9sZE9mZnNldCArIDFcbiAgXG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGVuY29kZTogcmVxdWlyZSgnLi9lbmNvZGUuanMnKVxuICAsIGRlY29kZTogcmVxdWlyZSgnLi9kZWNvZGUuanMnKVxuICAsIGVuY29kaW5nTGVuZ3RoOiByZXF1aXJlKCcuL2xlbmd0aC5qcycpXG59XG4iLCJcbnZhciBOMSA9IE1hdGgucG93KDIsICA3KVxudmFyIE4yID0gTWF0aC5wb3coMiwgMTQpXG52YXIgTjMgPSBNYXRoLnBvdygyLCAyMSlcbnZhciBONCA9IE1hdGgucG93KDIsIDI4KVxudmFyIE41ID0gTWF0aC5wb3coMiwgMzUpXG52YXIgTjYgPSBNYXRoLnBvdygyLCA0MilcbnZhciBONyA9IE1hdGgucG93KDIsIDQ5KVxudmFyIE44ID0gTWF0aC5wb3coMiwgNTYpXG52YXIgTjkgPSBNYXRoLnBvdygyLCA2MylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIChcbiAgICB2YWx1ZSA8IE4xID8gMVxuICA6IHZhbHVlIDwgTjIgPyAyXG4gIDogdmFsdWUgPCBOMyA/IDNcbiAgOiB2YWx1ZSA8IE40ID8gNFxuICA6IHZhbHVlIDwgTjUgPyA1XG4gIDogdmFsdWUgPCBONiA/IDZcbiAgOiB2YWx1ZSA8IE43ID8gN1xuICA6IHZhbHVlIDwgTjggPyA4XG4gIDogdmFsdWUgPCBOOSA/IDlcbiAgOiAgICAgICAgICAgICAgMTBcbiAgKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gIHRocm93IG5ldyBFcnJvcigncmFuZG9tLWFjY2Vzcy1maWxlIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhlIGJyb3dzZXInKVxufVxuIiwidmFyIEFic3RyYWN0ID0gcmVxdWlyZSgncmFuZG9tLWFjY2Vzcy1zdG9yYWdlJylcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJylcbnZhciBuZXh0VGljayA9IHJlcXVpcmUoJ25leHQtdGljaycpXG52YXIgb25jZSA9IHJlcXVpcmUoJ29uY2UnKVxudmFyIGJsb2NrcyA9IHJlcXVpcmUoJy4vbGliL2Jsb2Nrcy5qcycpXG52YXIgYnVmZmVyRnJvbSA9IHJlcXVpcmUoJ2J1ZmZlci1mcm9tJylcbnZhciBidWZmZXJBbGxvYyA9IHJlcXVpcmUoJ2J1ZmZlci1hbGxvYycpXG5cbnZhciBERUxJTSA9ICdcXDAnXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGRibmFtZSwgeG9wdHMpIHtcbiAgaWYgKCF4b3B0cykgeG9wdHMgPSB7fVxuICB2YXIgaWRiID0geG9wdHMuaWRiIHx8ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgID8gd2luZG93LmluZGV4ZWREQiB8fCB3aW5kb3cubW96SW5kZXhlZERCIHx8IHdpbmRvdy53ZWJraXRJbmRleGVkREIgfHwgd2luZG93Lm1zSW5kZXhlZERCXG4gICAgOiBudWxsKVxuICBpZiAoIWlkYikgdGhyb3cgbmV3IEVycm9yKCdpbmRleGVkREIgbm90IHByZXNlbnQgYW5kIG5vdCBnaXZlbicpXG4gIHZhciBkYiA9IG51bGxcbiAgdmFyIGRicXVldWUgPSBbXVxuICBpZiAodHlwZW9mIGlkYi5vcGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdmFyIHJlcSA9IGlkYi5vcGVuKGRibmFtZSlcbiAgICByZXEuYWRkRXZlbnRMaXN0ZW5lcigndXBncmFkZW5lZWRlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGRiID0gcmVxLnJlc3VsdFxuICAgICAgZGIuY3JlYXRlT2JqZWN0U3RvcmUoJ2RhdGEnKVxuICAgIH0pXG4gICAgcmVxLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Y2Nlc3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkYiA9IHJlcS5yZXN1bHRcbiAgICAgIGRicXVldWUuZm9yRWFjaChmdW5jdGlvbiAoY2IpIHsgY2IoZGIpIH0pXG4gICAgICBkYnF1ZXVlID0gbnVsbFxuICAgIH0pXG4gIH0gZWxzZSB7XG4gICAgZGIgPSBpZGJcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24gKG5hbWUsIG9wdHMpIHtcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBvcHRzID0gbmFtZVxuICAgICAgbmFtZSA9IG9wdHMubmFtZVxuICAgIH1cblxuICAgIGlmICghb3B0cykgb3B0cyA9IHt9XG4gICAgb3B0cy5uYW1lID0gbmFtZVxuXG4gICAgcmV0dXJuIG5ldyBTdG9yZShPYmplY3QuYXNzaWduKHsgZGI6IGdldGRiIH0sIHhvcHRzLCBvcHRzKSlcbiAgfVxuICBmdW5jdGlvbiBnZXRkYiAoY2IpIHtcbiAgICBpZiAoZGIpIG5leHRUaWNrKGZ1bmN0aW9uICgpIHsgY2IoZGIpIH0pXG4gICAgZWxzZSBkYnF1ZXVlLnB1c2goY2IpXG4gIH1cbn1cblxuZnVuY3Rpb24gU3RvcmUgKG9wdHMpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFN0b3JlKSkgcmV0dXJuIG5ldyBTdG9yZShvcHRzKVxuICBBYnN0cmFjdC5jYWxsKHRoaXMpXG4gIGlmICghb3B0cykgb3B0cyA9IHt9XG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ3N0cmluZycpIG9wdHMgPSB7IG5hbWU6IG9wdHMgfVxuICB0aGlzLnNpemUgPSBvcHRzLnNpemUgfHwgNDA5NlxuICB0aGlzLm5hbWUgPSBvcHRzLm5hbWVcbiAgdGhpcy5sZW5ndGggPSBvcHRzLmxlbmd0aCB8fCAwXG4gIHRoaXMuX2dldGRiID0gb3B0cy5kYlxufVxuaW5oZXJpdHMoU3RvcmUsIEFic3RyYWN0KVxuXG5TdG9yZS5wcm90b3R5cGUuX2Jsb2NrcyA9IGZ1bmN0aW9uIChpLCBqKSB7XG4gIHJldHVybiBibG9ja3ModGhpcy5zaXplLCBpLCBqKVxufVxuXG5TdG9yZS5wcm90b3R5cGUuX3JlYWQgPSBmdW5jdGlvbiAocmVxKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICB2YXIgYnVmZmVycyA9IFtdXG4gIHNlbGYuX3N0b3JlKCdyZWFkb25seScsIGZ1bmN0aW9uIChlcnIsIHN0b3JlKSB7XG4gICAgaWYgKChzZWxmLmxlbmd0aCB8fCAwKSA8IHJlcS5vZmZzZXQgKyByZXEuc2l6ZSkge1xuICAgICAgcmV0dXJuIHJlcS5jYWxsYmFjayhuZXcgRXJyb3IoJ0NvdWxkIG5vdCBzYXRpc2Z5IGxlbmd0aCcpLCBudWxsKVxuICAgIH1cbiAgICBpZiAoZXJyKSByZXR1cm4gcmVxLmNhbGxiYWNrKGVycilcbiAgICB2YXIgb2Zmc2V0cyA9IHNlbGYuX2Jsb2NrcyhyZXEub2Zmc2V0LCByZXEub2Zmc2V0ICsgcmVxLnNpemUpXG4gICAgdmFyIHBlbmRpbmcgPSBvZmZzZXRzLmxlbmd0aCArIDFcbiAgICB2YXIgZmlyc3RCbG9jayA9IG9mZnNldHMubGVuZ3RoID4gMCA/IG9mZnNldHNbMF0uYmxvY2sgOiAwXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvZmZzZXRzLmxlbmd0aDsgaSsrKSAoZnVuY3Rpb24gKG8pIHtcbiAgICAgIHZhciBrZXkgPSBzZWxmLm5hbWUgKyBERUxJTSArIG8uYmxvY2tcbiAgICAgIGJhY2tpZnkoc3RvcmUuZ2V0KGtleSksIGZ1bmN0aW9uIChlcnIsIGV2KSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiByZXEuY2FsbGJhY2soZXJyKVxuICAgICAgICBidWZmZXJzW28uYmxvY2sgLSBmaXJzdEJsb2NrXSA9IGV2LnRhcmdldC5yZXN1bHRcbiAgICAgICAgICA/IGJ1ZmZlckZyb20oZXYudGFyZ2V0LnJlc3VsdC5zdWJhcnJheShvLnN0YXJ0LCBvLmVuZCkpXG4gICAgICAgICAgOiBidWZmZXJBbGxvYyhvLmVuZCAtIG8uc3RhcnQpXG4gICAgICAgIGlmICgtLXBlbmRpbmcgPT09IDApIHJlcS5jYWxsYmFjayhudWxsLCBCdWZmZXIuY29uY2F0KGJ1ZmZlcnMpKVxuICAgICAgfSlcbiAgICB9KShvZmZzZXRzW2ldKVxuICAgIGlmICgtLXBlbmRpbmcgPT09IDApIHJlcS5jYWxsYmFjayhudWxsLCBCdWZmZXIuY29uY2F0KGJ1ZmZlcnMpKVxuICB9KVxufVxuXG5TdG9yZS5wcm90b3R5cGUuX3dyaXRlID0gZnVuY3Rpb24gKHJlcSkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgc2VsZi5fc3RvcmUoJ3JlYWR3cml0ZScsIGZ1bmN0aW9uIChlcnIsIHN0b3JlKSB7XG4gICAgaWYgKGVycikgcmV0dXJuIHJlcS5jYWxsYmFjayhlcnIpXG4gICAgdmFyIG9mZnNldHMgPSBzZWxmLl9ibG9ja3MocmVxLm9mZnNldCwgcmVxLm9mZnNldCArIHJlcS5kYXRhLmxlbmd0aClcbiAgICB2YXIgcGVuZGluZyA9IDFcbiAgICB2YXIgYnVmZmVycyA9IHt9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvZmZzZXRzLmxlbmd0aDsgaSsrKSAoZnVuY3Rpb24gKG8sIGkpIHtcbiAgICAgIGlmIChvLmVuZCAtIG8uc3RhcnQgPT09IHNlbGYuc2l6ZSkgcmV0dXJuXG4gICAgICBwZW5kaW5nKytcbiAgICAgIHZhciBrZXkgPSBzZWxmLm5hbWUgKyBERUxJTSArIG8uYmxvY2tcbiAgICAgIGJhY2tpZnkoc3RvcmUuZ2V0KGtleSksIGZ1bmN0aW9uIChlcnIsIGV2KSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiByZXEuY2FsbGJhY2soZXJyKVxuICAgICAgICBidWZmZXJzW2ldID0gYnVmZmVyRnJvbShldi50YXJnZXQucmVzdWx0IHx8IGJ1ZmZlckFsbG9jKHNlbGYuc2l6ZSkpXG4gICAgICAgIGlmICgtLXBlbmRpbmcgPT09IDApIHdyaXRlKHN0b3JlLCBvZmZzZXRzLCBidWZmZXJzKVxuICAgICAgfSlcbiAgICB9KShvZmZzZXRzW2ldLCBpKVxuICAgIGlmICgtLXBlbmRpbmcgPT09IDApIHdyaXRlKHN0b3JlLCBvZmZzZXRzLCBidWZmZXJzKVxuICB9KVxuXG4gIGZ1bmN0aW9uIHdyaXRlIChzdG9yZSwgb2Zmc2V0cywgYnVmZmVycykge1xuICAgIHZhciBibG9ja1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IG9mZnNldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBvID0gb2Zmc2V0c1tpXVxuICAgICAgdmFyIGxlbiA9IG8uZW5kIC0gby5zdGFydFxuICAgICAgaWYgKGxlbiA9PT0gc2VsZi5zaXplKSB7XG4gICAgICAgIGJsb2NrID0gcmVxLmRhdGEuc2xpY2UoaiwgaiArIGxlbilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJsb2NrID0gYnVmZmVyc1tpXVxuICAgICAgICByZXEuZGF0YS5jb3B5KGJsb2NrLCBvLnN0YXJ0LCBqLCBqICsgbGVuKVxuICAgICAgfVxuICAgICAgc3RvcmUucHV0KGJsb2NrLCBzZWxmLm5hbWUgKyBERUxJTSArIG8uYmxvY2spXG4gICAgICBqICs9IGxlblxuICAgIH1cblxuICAgIHZhciBsZW5ndGggPSBNYXRoLm1heChzZWxmLmxlbmd0aCB8fCAwLCByZXEub2Zmc2V0ICsgcmVxLmRhdGEubGVuZ3RoKVxuICAgIHN0b3JlLnB1dChsZW5ndGgsIHNlbGYubmFtZSArIERFTElNICsgJ2xlbmd0aCcpXG4gICAgc3RvcmUudHJhbnNhY3Rpb24uYWRkRXZlbnRMaXN0ZW5lcignY29tcGxldGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLmxlbmd0aCA9IGxlbmd0aFxuICAgICAgcmVxLmNhbGxiYWNrKG51bGwpXG4gICAgfSlcbiAgICBzdG9yZS50cmFuc2FjdGlvbi5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHJlcS5jYWxsYmFjaylcbiAgfVxufVxuXG5TdG9yZS5wcm90b3R5cGUuX3N0b3JlID0gZnVuY3Rpb24gKG1vZGUsIGNiKSB7XG4gIGNiID0gb25jZShjYilcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIHNlbGYuX2dldGRiKGZ1bmN0aW9uIChkYikge1xuICAgIHZhciB0eCA9IGRiLnRyYW5zYWN0aW9uKFsnZGF0YSddLCBtb2RlKVxuICAgIHZhciBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdkYXRhJylcbiAgICB0eC5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGNiKVxuICAgIGNiKG51bGwsIHN0b3JlKVxuICB9KVxufVxuXG5TdG9yZS5wcm90b3R5cGUuX29wZW4gPSBmdW5jdGlvbiAocmVxKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICB0aGlzLl9nZXRkYihmdW5jdGlvbiAoZGIpIHtcbiAgICBzZWxmLl9zdG9yZSgncmVhZG9ubHknLCBmdW5jdGlvbiAoZXJyLCBzdG9yZSkge1xuICAgICAgaWYgKGVycikgcmV0dXJuIHJlcS5jYWxsYmFjayhlcnIpXG4gICAgICBiYWNraWZ5KHN0b3JlLmdldChzZWxmLm5hbWUgKyBERUxJTSArICdsZW5ndGgnKSwgZnVuY3Rpb24gKGVyciwgZXYpIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIHJlcS5jYWxsYmFjayhlcnIpXG4gICAgICAgIHNlbGYubGVuZ3RoID0gZXYudGFyZ2V0LnJlc3VsdCB8fCAwXG4gICAgICAgIHJlcS5jYWxsYmFjayhudWxsKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxufVxuXG5mdW5jdGlvbiBiYWNraWZ5IChyLCBjYikge1xuICByLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Y2Nlc3MnLCBmdW5jdGlvbiAoZXYpIHsgY2IobnVsbCwgZXYpIH0pXG4gIHIuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBjYilcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNpemUsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJlc3VsdCA9IFtdXG4gIGZvciAodmFyIG4gPSBNYXRoLmZsb29yKHN0YXJ0IC8gc2l6ZSkgKiBzaXplOyBuIDwgZW5kOyBuICs9IHNpemUpIHtcbiAgICByZXN1bHQucHVzaCh7XG4gICAgICBibG9jazogTWF0aC5mbG9vcihuIC8gc2l6ZSksXG4gICAgICBzdGFydDogTWF0aC5tYXgobiwgc3RhcnQpICUgc2l6ZSxcbiAgICAgIGVuZDogTWF0aC5taW4obiArIHNpemUsIGVuZCkgJSBzaXplIHx8IHNpemVcbiAgICB9KVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cbiIsInZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcblxudmFyIGlzTW9kZXJuID0gKFxuICB0eXBlb2YgQnVmZmVyLmFsbG9jID09PSAnZnVuY3Rpb24nICYmXG4gIHR5cGVvZiBCdWZmZXIuYWxsb2NVbnNhZmUgPT09ICdmdW5jdGlvbicgJiZcbiAgdHlwZW9mIEJ1ZmZlci5mcm9tID09PSAnZnVuY3Rpb24nXG4pXG5cbmZ1bmN0aW9uIGlzQXJyYXlCdWZmZXIgKGlucHV0KSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKGlucHV0KS5zbGljZSg4LCAtMSkgPT09ICdBcnJheUJ1ZmZlcidcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyIChvYmosIGJ5dGVPZmZzZXQsIGxlbmd0aCkge1xuICBieXRlT2Zmc2V0ID4+Pj0gMFxuXG4gIHZhciBtYXhMZW5ndGggPSBvYmouYnl0ZUxlbmd0aCAtIGJ5dGVPZmZzZXRcblxuICBpZiAobWF4TGVuZ3RoIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiJ29mZnNldCcgaXMgb3V0IG9mIGJvdW5kc1wiKVxuICB9XG5cbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gbWF4TGVuZ3RoXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID4+Pj0gMFxuXG4gICAgaWYgKGxlbmd0aCA+IG1heExlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCInbGVuZ3RoJyBpcyBvdXQgb2YgYm91bmRzXCIpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGlzTW9kZXJuXG4gICAgPyBCdWZmZXIuZnJvbShvYmouc2xpY2UoYnl0ZU9mZnNldCwgYnl0ZU9mZnNldCArIGxlbmd0aCkpXG4gICAgOiBuZXcgQnVmZmVyKG5ldyBVaW50OEFycmF5KG9iai5zbGljZShieXRlT2Zmc2V0LCBieXRlT2Zmc2V0ICsgbGVuZ3RoKSkpXG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcgKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycgfHwgZW5jb2RpbmcgPT09ICcnKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgfVxuXG4gIGlmICghQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJlbmNvZGluZ1wiIG11c3QgYmUgYSB2YWxpZCBzdHJpbmcgZW5jb2RpbmcnKVxuICB9XG5cbiAgcmV0dXJuIGlzTW9kZXJuXG4gICAgPyBCdWZmZXIuZnJvbShzdHJpbmcsIGVuY29kaW5nKVxuICAgIDogbmV3IEJ1ZmZlcihzdHJpbmcsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBidWZmZXJGcm9tICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIGEgbnVtYmVyJylcbiAgfVxuXG4gIGlmIChpc0FycmF5QnVmZmVyKHZhbHVlKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQpXG4gIH1cblxuICByZXR1cm4gaXNNb2Rlcm5cbiAgICA/IEJ1ZmZlci5mcm9tKHZhbHVlKVxuICAgIDogbmV3IEJ1ZmZlcih2YWx1ZSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBidWZmZXJGcm9tXG4iLCJjb25zdCByYWYgPSByZXF1aXJlKCdyYW5kb20tYWNjZXNzLWZpbGUnKVxuY29uc3Qge1JlcXVlc3QsIENhbGxiYWNrLCBBY3Rpb259ID0gcmVxdWlyZSgnLi9wcm90bycpXG5jb25zdCByYWZNYXAgPSBuZXcgTWFwKClcblxuZnVuY3Rpb24gUmFzQnJpZGdlIChnZXRSYXMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChkYXRhLCBjYikge1xuICAgIGRhdGEgPSBSZXF1ZXN0LmRlY29kZShkYXRhKVxuXG4gICAgaWYgKCFyYWZNYXAuaGFzKGRhdGEubmFtZSkpIHtcbiAgICAgIHJhZk1hcC5zZXQoZGF0YS5uYW1lLCBnZXRSYXMoZGF0YS5uYW1lKSlcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50ID0gcmFmTWFwLmdldChkYXRhLm5hbWUpXG5cbiAgICBkYXRhLmNhbGxiYWNrID0gZnVuY3Rpb24gKGVycm9yLCBhcmcpIHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge2lkOiBkYXRhLmlkLCBlcnJvcjogZXJyb3IsIG5hbWU6IGRhdGEubmFtZSwgc3RhdDogbnVsbCwgZGF0YTogbnVsbH1cblxuICAgICAgaWYgKGFyZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChCdWZmZXIuaXNCdWZmZXIoYXJnKSkgcmVzcG9uc2UuZGF0YSA9IGFyZ1xuICAgICAgICBlbHNlIHJlc3BvbnNlLnN0YXQgPSBhcmdcbiAgICAgIH1cblxuICAgICAgY2IoQ2FsbGJhY2suZW5jb2RlKHJlc3BvbnNlKSlcbiAgICB9XG5cbiAgICBwcm9wYWdhdGUoZGF0YSwgY3VycmVudClcbiAgfVxufVxuXG5mdW5jdGlvbiBwcm9wYWdhdGUgKHJlcXVlc3QsIHJhcykge1xuICBzd2l0Y2ggKHJlcXVlc3QuYWN0aW9uKSB7XG4gICAgY2FzZSBBY3Rpb24uT1BFTjpcbiAgICAgIHJhcy5vcGVuKHJlcXVlc3QuY2FsbGJhY2spXG4gICAgICByZXR1cm5cbiAgICBjYXNlIEFjdGlvbi5PUEVOUkVBRE9OTFk6XG4gICAgICByYXMub3BlbihyZXF1ZXN0LmNhbGxiYWNrKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBBY3Rpb24uUkVBRDpcbiAgICAgIHJhcy5yZWFkKHJlcXVlc3Qub2Zmc2V0LCByZXF1ZXN0LnNpemUsIHJlcXVlc3QuY2FsbGJhY2spXG4gICAgICByZXR1cm5cbiAgICBjYXNlIEFjdGlvbi5XUklURTpcbiAgICAgIHJhcy53cml0ZShyZXF1ZXN0Lm9mZnNldCwgcmVxdWVzdC5kYXRhLCByZXF1ZXN0LmNhbGxiYWNrKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBBY3Rpb24uREVMOlxuICAgICAgcmFzLmRlbChyZXF1ZXN0Lm9mZnNldCwgcmVxdWVzdC5zaXplLCByZXF1ZXN0LmNhbGxiYWNrKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBBY3Rpb24uU1RBVDpcbiAgICAgIHJhcy5zdGF0KHJlcXVlc3QuY2FsbGJhY2spXG4gICAgICByZXR1cm5cbiAgICBjYXNlIEFjdGlvbi5DTE9TRTpcbiAgICAgIHJhcy5jbG9zZShyZXF1ZXN0LmNhbGxiYWNrKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBBY3Rpb24uREVTVFJPWTpcbiAgICAgIHJhcy5kZXN0cm95KHJlcXVlc3QuY2FsbGJhY2spXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSYXNCcmlkZ2Vcbm1vZHVsZS5leHBvcnRzLnByb3BhZ2F0ZSA9IHByb3BhZ2F0ZVxuIiwiY29uc3QgcmFzID0gcmVxdWlyZSgncmFuZG9tLWFjY2Vzcy1zdG9yYWdlJylcbmNvbnN0IHtBY3Rpb259ID0gcmVxdWlyZSgnLi9wcm90bycpXG5jb25zdCBOb29wVHJhbnNwb3J0ID0gcmVxdWlyZSgnLi90cmFuc3BvcnQnKVxuY29uc3QgZW1wdHkgPSBCdWZmZXIuYWxsb2MoMClcblxuZnVuY3Rpb24gUkFOIChuYW1lLCB0cmFuc3BvcnQpIHtcbiAgdHJhbnNwb3J0ID0gdHJhbnNwb3J0IHx8IG5ldyBOb29wVHJhbnNwb3J0KG5hbWUpXG5cbiAgZnVuY3Rpb24gc2VuZCAoYWN0aW9uLCByZXEpIHtcbiAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgYWN0aW9uOiBhY3Rpb24sXG4gICAgICBzaXplOiByZXEuc2l6ZSB8fCAwLFxuICAgICAgb2Zmc2V0OiByZXEub2Zmc2V0IHx8IDBcbiAgICB9XG5cbiAgICBpZiAoYWN0aW9uID09PSBBY3Rpb24uV1JJVEUpIHtcbiAgICAgIHJlcXVlc3QuZGF0YSA9IHJlcS5kYXRhIHx8IGVtcHR5XG4gICAgfVxuXG4gICAgdHJhbnNwb3J0Ll9xdWV1ZShyZXF1ZXN0LCByZXEpXG4gIH1cblxuICByZXR1cm4gcmFzKHtcbiAgICBvcGVuOiAocmVxKSA9PiBzZW5kKEFjdGlvbi5PUEVOLCByZXEpLFxuICAgIHJlYWQ6IChyZXEpID0+IHNlbmQoQWN0aW9uLlJFQUQsIHJlcSksXG4gICAgb3BlblJlYWRvbmx5OiAocmVxKSA9PiBzZW5kKEFjdGlvbi5PUEVOUkVBRE9OTFksIHJlcSksXG4gICAgd3JpdGU6IChyZXEpID0+IHNlbmQoQWN0aW9uLldSSVRFLCByZXEpLFxuICAgIGRlbDogKHJlcSkgPT4gc2VuZChBY3Rpb24uREVMLCByZXEpLFxuICAgIHN0YXQ6IChyZXEpID0+IHNlbmQoQWN0aW9uLlNUQVQsIHJlcSksXG4gICAgY2xvc2U6IChyZXEpID0+IHNlbmQoQWN0aW9uLkNMT1NFLCByZXEpLFxuICAgIGRlc3Ryb3k6IChyZXEpID0+IHNlbmQoQWN0aW9uLkRFU1RST1ksIHJlcSlcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSQU5cbm1vZHVsZS5leHBvcnRzLlJBTiA9IFJBTlxubW9kdWxlLmV4cG9ydHMuTm9vcFRyYW5zcG9ydCA9IE5vb3BUcmFuc3BvcnRcbm1vZHVsZS5leHBvcnRzLlN0cmVhbVRyYW5zcG9ydCA9IHJlcXVpcmUoJy4vdHJhbnNwb3J0cy9zdHJlYW0nKVxubW9kdWxlLmV4cG9ydHMuUmFzQnJpZGdlID0gcmVxdWlyZSgnLi9icmlkZ2UnKVxuIiwiLy8gVGhpcyBmaWxlIGlzIGF1dG8gZ2VuZXJhdGVkIGJ5IHRoZSBwcm90b2NvbC1idWZmZXJzIGNsaSB0b29sXG5cbi8qIGVzbGludC1kaXNhYmxlIHF1b3RlcyAqL1xuLyogZXNsaW50LWRpc2FibGUgaW5kZW50ICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1yZWRlY2xhcmUgKi9cbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuXG4vLyBSZW1lbWJlciB0byBgbnBtIGluc3RhbGwgLS1zYXZlIHByb3RvY29sLWJ1ZmZlcnMtZW5jb2RpbmdzYFxudmFyIGVuY29kaW5ncyA9IHJlcXVpcmUoJ3Byb3RvY29sLWJ1ZmZlcnMtZW5jb2RpbmdzJylcbnZhciB2YXJpbnQgPSBlbmNvZGluZ3MudmFyaW50XG52YXIgc2tpcCA9IGVuY29kaW5ncy5za2lwXG5cbmV4cG9ydHMuQWN0aW9uID0ge1xuICBcIk9QRU5cIjogMCxcbiAgXCJPUEVOUkVBRE9OTFlcIjogMSxcbiAgXCJSRUFEXCI6IDIsXG4gIFwiV1JJVEVcIjogMyxcbiAgXCJERUxcIjogNCxcbiAgXCJTVEFUXCI6IDUsXG4gIFwiQ0xPU0VcIjogNixcbiAgXCJERVNUUk9ZXCI6IDdcbn1cblxudmFyIFJlcXVlc3QgPSBleHBvcnRzLlJlcXVlc3QgPSB7XG4gIGJ1ZmZlcjogdHJ1ZSxcbiAgZW5jb2RpbmdMZW5ndGg6IG51bGwsXG4gIGVuY29kZTogbnVsbCxcbiAgZGVjb2RlOiBudWxsXG59XG5cbnZhciBFcnJvciA9IGV4cG9ydHMuRXJyb3IgPSB7XG4gIGJ1ZmZlcjogdHJ1ZSxcbiAgZW5jb2RpbmdMZW5ndGg6IG51bGwsXG4gIGVuY29kZTogbnVsbCxcbiAgZGVjb2RlOiBudWxsXG59XG5cbnZhciBTdGF0ID0gZXhwb3J0cy5TdGF0ID0ge1xuICBidWZmZXI6IHRydWUsXG4gIGVuY29kaW5nTGVuZ3RoOiBudWxsLFxuICBlbmNvZGU6IG51bGwsXG4gIGRlY29kZTogbnVsbFxufVxuXG52YXIgQ2FsbGJhY2sgPSBleHBvcnRzLkNhbGxiYWNrID0ge1xuICBidWZmZXI6IHRydWUsXG4gIGVuY29kaW5nTGVuZ3RoOiBudWxsLFxuICBlbmNvZGU6IG51bGwsXG4gIGRlY29kZTogbnVsbFxufVxuXG5kZWZpbmVSZXF1ZXN0KClcbmRlZmluZUVycm9yKClcbmRlZmluZVN0YXQoKVxuZGVmaW5lQ2FsbGJhY2soKVxuXG5mdW5jdGlvbiBkZWZpbmVSZXF1ZXN0ICgpIHtcbiAgdmFyIGVuYyA9IFtcbiAgICBlbmNvZGluZ3MuZW51bSxcbiAgICBlbmNvZGluZ3Muc3RyaW5nLFxuICAgIGVuY29kaW5ncy5pbnQzMixcbiAgICBlbmNvZGluZ3MuYnl0ZXNcbiAgXVxuXG4gIFJlcXVlc3QuZW5jb2RpbmdMZW5ndGggPSBlbmNvZGluZ0xlbmd0aFxuICBSZXF1ZXN0LmVuY29kZSA9IGVuY29kZVxuICBSZXF1ZXN0LmRlY29kZSA9IGRlY29kZVxuXG4gIGZ1bmN0aW9uIGVuY29kaW5nTGVuZ3RoIChvYmopIHtcbiAgICB2YXIgbGVuZ3RoID0gMFxuICAgIGlmICghZGVmaW5lZChvYmouYWN0aW9uKSkgdGhyb3cgbmV3IEVycm9yKFwiYWN0aW9uIGlzIHJlcXVpcmVkXCIpXG4gICAgdmFyIGxlbiA9IGVuY1swXS5lbmNvZGluZ0xlbmd0aChvYmouYWN0aW9uKVxuICAgIGxlbmd0aCArPSAxICsgbGVuXG4gICAgaWYgKCFkZWZpbmVkKG9iai5uYW1lKSkgdGhyb3cgbmV3IEVycm9yKFwibmFtZSBpcyByZXF1aXJlZFwiKVxuICAgIHZhciBsZW4gPSBlbmNbMV0uZW5jb2RpbmdMZW5ndGgob2JqLm5hbWUpXG4gICAgbGVuZ3RoICs9IDEgKyBsZW5cbiAgICBpZiAoIWRlZmluZWQob2JqLmlkKSkgdGhyb3cgbmV3IEVycm9yKFwiaWQgaXMgcmVxdWlyZWRcIilcbiAgICB2YXIgbGVuID0gZW5jWzJdLmVuY29kaW5nTGVuZ3RoKG9iai5pZClcbiAgICBsZW5ndGggKz0gMSArIGxlblxuICAgIGlmICghZGVmaW5lZChvYmouc2l6ZSkpIHRocm93IG5ldyBFcnJvcihcInNpemUgaXMgcmVxdWlyZWRcIilcbiAgICB2YXIgbGVuID0gZW5jWzJdLmVuY29kaW5nTGVuZ3RoKG9iai5zaXplKVxuICAgIGxlbmd0aCArPSAxICsgbGVuXG4gICAgaWYgKCFkZWZpbmVkKG9iai5vZmZzZXQpKSB0aHJvdyBuZXcgRXJyb3IoXCJvZmZzZXQgaXMgcmVxdWlyZWRcIilcbiAgICB2YXIgbGVuID0gZW5jWzJdLmVuY29kaW5nTGVuZ3RoKG9iai5vZmZzZXQpXG4gICAgbGVuZ3RoICs9IDEgKyBsZW5cbiAgICBpZiAoZGVmaW5lZChvYmouZGF0YSkpIHtcbiAgICAgIHZhciBsZW4gPSBlbmNbM10uZW5jb2RpbmdMZW5ndGgob2JqLmRhdGEpXG4gICAgICBsZW5ndGggKz0gMSArIGxlblxuICAgIH1cbiAgICByZXR1cm4gbGVuZ3RoXG4gIH1cblxuICBmdW5jdGlvbiBlbmNvZGUgKG9iaiwgYnVmLCBvZmZzZXQpIHtcbiAgICBpZiAoIW9mZnNldCkgb2Zmc2V0ID0gMFxuICAgIGlmICghYnVmKSBidWYgPSBCdWZmZXIuYWxsb2NVbnNhZmUoZW5jb2RpbmdMZW5ndGgob2JqKSlcbiAgICB2YXIgb2xkT2Zmc2V0ID0gb2Zmc2V0XG4gICAgaWYgKCFkZWZpbmVkKG9iai5hY3Rpb24pKSB0aHJvdyBuZXcgRXJyb3IoXCJhY3Rpb24gaXMgcmVxdWlyZWRcIilcbiAgICBidWZbb2Zmc2V0KytdID0gOFxuICAgIGVuY1swXS5lbmNvZGUob2JqLmFjdGlvbiwgYnVmLCBvZmZzZXQpXG4gICAgb2Zmc2V0ICs9IGVuY1swXS5lbmNvZGUuYnl0ZXNcbiAgICBpZiAoIWRlZmluZWQob2JqLm5hbWUpKSB0aHJvdyBuZXcgRXJyb3IoXCJuYW1lIGlzIHJlcXVpcmVkXCIpXG4gICAgYnVmW29mZnNldCsrXSA9IDE4XG4gICAgZW5jWzFdLmVuY29kZShvYmoubmFtZSwgYnVmLCBvZmZzZXQpXG4gICAgb2Zmc2V0ICs9IGVuY1sxXS5lbmNvZGUuYnl0ZXNcbiAgICBpZiAoIWRlZmluZWQob2JqLmlkKSkgdGhyb3cgbmV3IEVycm9yKFwiaWQgaXMgcmVxdWlyZWRcIilcbiAgICBidWZbb2Zmc2V0KytdID0gMjRcbiAgICBlbmNbMl0uZW5jb2RlKG9iai5pZCwgYnVmLCBvZmZzZXQpXG4gICAgb2Zmc2V0ICs9IGVuY1syXS5lbmNvZGUuYnl0ZXNcbiAgICBpZiAoIWRlZmluZWQob2JqLnNpemUpKSB0aHJvdyBuZXcgRXJyb3IoXCJzaXplIGlzIHJlcXVpcmVkXCIpXG4gICAgYnVmW29mZnNldCsrXSA9IDMyXG4gICAgZW5jWzJdLmVuY29kZShvYmouc2l6ZSwgYnVmLCBvZmZzZXQpXG4gICAgb2Zmc2V0ICs9IGVuY1syXS5lbmNvZGUuYnl0ZXNcbiAgICBpZiAoIWRlZmluZWQob2JqLm9mZnNldCkpIHRocm93IG5ldyBFcnJvcihcIm9mZnNldCBpcyByZXF1aXJlZFwiKVxuICAgIGJ1ZltvZmZzZXQrK10gPSA0MFxuICAgIGVuY1syXS5lbmNvZGUob2JqLm9mZnNldCwgYnVmLCBvZmZzZXQpXG4gICAgb2Zmc2V0ICs9IGVuY1syXS5lbmNvZGUuYnl0ZXNcbiAgICBpZiAoZGVmaW5lZChvYmouZGF0YSkpIHtcbiAgICAgIGJ1ZltvZmZzZXQrK10gPSA1MFxuICAgICAgZW5jWzNdLmVuY29kZShvYmouZGF0YSwgYnVmLCBvZmZzZXQpXG4gICAgICBvZmZzZXQgKz0gZW5jWzNdLmVuY29kZS5ieXRlc1xuICAgIH1cbiAgICBlbmNvZGUuYnl0ZXMgPSBvZmZzZXQgLSBvbGRPZmZzZXRcbiAgICByZXR1cm4gYnVmXG4gIH1cblxuICBmdW5jdGlvbiBkZWNvZGUgKGJ1Ziwgb2Zmc2V0LCBlbmQpIHtcbiAgICBpZiAoIW9mZnNldCkgb2Zmc2V0ID0gMFxuICAgIGlmICghZW5kKSBlbmQgPSBidWYubGVuZ3RoXG4gICAgaWYgKCEoZW5kIDw9IGJ1Zi5sZW5ndGggJiYgb2Zmc2V0IDw9IGJ1Zi5sZW5ndGgpKSB0aHJvdyBuZXcgRXJyb3IoXCJEZWNvZGVkIG1lc3NhZ2UgaXMgbm90IHZhbGlkXCIpXG4gICAgdmFyIG9sZE9mZnNldCA9IG9mZnNldFxuICAgIHZhciBvYmogPSB7XG4gICAgICBhY3Rpb246IDAsXG4gICAgICBuYW1lOiBcIlwiLFxuICAgICAgaWQ6IDAsXG4gICAgICBzaXplOiAwLFxuICAgICAgb2Zmc2V0OiAwLFxuICAgICAgZGF0YTogbnVsbFxuICAgIH1cbiAgICB2YXIgZm91bmQwID0gZmFsc2VcbiAgICB2YXIgZm91bmQxID0gZmFsc2VcbiAgICB2YXIgZm91bmQyID0gZmFsc2VcbiAgICB2YXIgZm91bmQzID0gZmFsc2VcbiAgICB2YXIgZm91bmQ0ID0gZmFsc2VcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKGVuZCA8PSBvZmZzZXQpIHtcbiAgICAgICAgaWYgKCFmb3VuZDAgfHwgIWZvdW5kMSB8fCAhZm91bmQyIHx8ICFmb3VuZDMgfHwgIWZvdW5kNCkgdGhyb3cgbmV3IEVycm9yKFwiRGVjb2RlZCBtZXNzYWdlIGlzIG5vdCB2YWxpZFwiKVxuICAgICAgICBkZWNvZGUuYnl0ZXMgPSBvZmZzZXQgLSBvbGRPZmZzZXRcbiAgICAgICAgcmV0dXJuIG9ialxuICAgICAgfVxuICAgICAgdmFyIHByZWZpeCA9IHZhcmludC5kZWNvZGUoYnVmLCBvZmZzZXQpXG4gICAgICBvZmZzZXQgKz0gdmFyaW50LmRlY29kZS5ieXRlc1xuICAgICAgdmFyIHRhZyA9IHByZWZpeCA+PiAzXG4gICAgICBzd2l0Y2ggKHRhZykge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgIG9iai5hY3Rpb24gPSBlbmNbMF0uZGVjb2RlKGJ1Ziwgb2Zmc2V0KVxuICAgICAgICBvZmZzZXQgKz0gZW5jWzBdLmRlY29kZS5ieXRlc1xuICAgICAgICBmb3VuZDAgPSB0cnVlXG4gICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgb2JqLm5hbWUgPSBlbmNbMV0uZGVjb2RlKGJ1Ziwgb2Zmc2V0KVxuICAgICAgICBvZmZzZXQgKz0gZW5jWzFdLmRlY29kZS5ieXRlc1xuICAgICAgICBmb3VuZDEgPSB0cnVlXG4gICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgb2JqLmlkID0gZW5jWzJdLmRlY29kZShidWYsIG9mZnNldClcbiAgICAgICAgb2Zmc2V0ICs9IGVuY1syXS5kZWNvZGUuYnl0ZXNcbiAgICAgICAgZm91bmQyID0gdHJ1ZVxuICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgIG9iai5zaXplID0gZW5jWzJdLmRlY29kZShidWYsIG9mZnNldClcbiAgICAgICAgb2Zmc2V0ICs9IGVuY1syXS5kZWNvZGUuYnl0ZXNcbiAgICAgICAgZm91bmQzID0gdHJ1ZVxuICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDU6XG4gICAgICAgIG9iai5vZmZzZXQgPSBlbmNbMl0uZGVjb2RlKGJ1Ziwgb2Zmc2V0KVxuICAgICAgICBvZmZzZXQgKz0gZW5jWzJdLmRlY29kZS5ieXRlc1xuICAgICAgICBmb3VuZDQgPSB0cnVlXG4gICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNjpcbiAgICAgICAgb2JqLmRhdGEgPSBlbmNbM10uZGVjb2RlKGJ1Ziwgb2Zmc2V0KVxuICAgICAgICBvZmZzZXQgKz0gZW5jWzNdLmRlY29kZS5ieXRlc1xuICAgICAgICBicmVha1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICBvZmZzZXQgPSBza2lwKHByZWZpeCAmIDcsIGJ1Ziwgb2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkZWZpbmVFcnJvciAoKSB7XG4gIHZhciBlbmMgPSBbXG4gICAgZW5jb2RpbmdzLnN0cmluZ1xuICBdXG5cbiAgRXJyb3IuZW5jb2RpbmdMZW5ndGggPSBlbmNvZGluZ0xlbmd0aFxuICBFcnJvci5lbmNvZGUgPSBlbmNvZGVcbiAgRXJyb3IuZGVjb2RlID0gZGVjb2RlXG5cbiAgZnVuY3Rpb24gZW5jb2RpbmdMZW5ndGggKG9iaikge1xuICAgIHZhciBsZW5ndGggPSAwXG4gICAgaWYgKCFkZWZpbmVkKG9iai5tZXNzYWdlKSkgdGhyb3cgbmV3IEVycm9yKFwibWVzc2FnZSBpcyByZXF1aXJlZFwiKVxuICAgIHZhciBsZW4gPSBlbmNbMF0uZW5jb2RpbmdMZW5ndGgob2JqLm1lc3NhZ2UpXG4gICAgbGVuZ3RoICs9IDEgKyBsZW5cbiAgICBpZiAoIWRlZmluZWQob2JqLnN0YWNrKSkgdGhyb3cgbmV3IEVycm9yKFwic3RhY2sgaXMgcmVxdWlyZWRcIilcbiAgICB2YXIgbGVuID0gZW5jWzBdLmVuY29kaW5nTGVuZ3RoKG9iai5zdGFjaylcbiAgICBsZW5ndGggKz0gMSArIGxlblxuICAgIHJldHVybiBsZW5ndGhcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuY29kZSAob2JqLCBidWYsIG9mZnNldCkge1xuICAgIGlmICghb2Zmc2V0KSBvZmZzZXQgPSAwXG4gICAgaWYgKCFidWYpIGJ1ZiA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShlbmNvZGluZ0xlbmd0aChvYmopKVxuICAgIHZhciBvbGRPZmZzZXQgPSBvZmZzZXRcbiAgICBpZiAoIWRlZmluZWQob2JqLm1lc3NhZ2UpKSB0aHJvdyBuZXcgRXJyb3IoXCJtZXNzYWdlIGlzIHJlcXVpcmVkXCIpXG4gICAgYnVmW29mZnNldCsrXSA9IDEwXG4gICAgZW5jWzBdLmVuY29kZShvYmoubWVzc2FnZSwgYnVmLCBvZmZzZXQpXG4gICAgb2Zmc2V0ICs9IGVuY1swXS5lbmNvZGUuYnl0ZXNcbiAgICBpZiAoIWRlZmluZWQob2JqLnN0YWNrKSkgdGhyb3cgbmV3IEVycm9yKFwic3RhY2sgaXMgcmVxdWlyZWRcIilcbiAgICBidWZbb2Zmc2V0KytdID0gMThcbiAgICBlbmNbMF0uZW5jb2RlKG9iai5zdGFjaywgYnVmLCBvZmZzZXQpXG4gICAgb2Zmc2V0ICs9IGVuY1swXS5lbmNvZGUuYnl0ZXNcbiAgICBlbmNvZGUuYnl0ZXMgPSBvZmZzZXQgLSBvbGRPZmZzZXRcbiAgICByZXR1cm4gYnVmXG4gIH1cblxuICBmdW5jdGlvbiBkZWNvZGUgKGJ1Ziwgb2Zmc2V0LCBlbmQpIHtcbiAgICBpZiAoIW9mZnNldCkgb2Zmc2V0ID0gMFxuICAgIGlmICghZW5kKSBlbmQgPSBidWYubGVuZ3RoXG4gICAgaWYgKCEoZW5kIDw9IGJ1Zi5sZW5ndGggJiYgb2Zmc2V0IDw9IGJ1Zi5sZW5ndGgpKSB0aHJvdyBuZXcgRXJyb3IoXCJEZWNvZGVkIG1lc3NhZ2UgaXMgbm90IHZhbGlkXCIpXG4gICAgdmFyIG9sZE9mZnNldCA9IG9mZnNldFxuICAgIHZhciBvYmogPSB7XG4gICAgICBtZXNzYWdlOiBcIlwiLFxuICAgICAgc3RhY2s6IFwiXCJcbiAgICB9XG4gICAgdmFyIGZvdW5kMCA9IGZhbHNlXG4gICAgdmFyIGZvdW5kMSA9IGZhbHNlXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmIChlbmQgPD0gb2Zmc2V0KSB7XG4gICAgICAgIGlmICghZm91bmQwIHx8ICFmb3VuZDEpIHRocm93IG5ldyBFcnJvcihcIkRlY29kZWQgbWVzc2FnZSBpcyBub3QgdmFsaWRcIilcbiAgICAgICAgZGVjb2RlLmJ5dGVzID0gb2Zmc2V0IC0gb2xkT2Zmc2V0XG4gICAgICAgIHJldHVybiBvYmpcbiAgICAgIH1cbiAgICAgIHZhciBwcmVmaXggPSB2YXJpbnQuZGVjb2RlKGJ1Ziwgb2Zmc2V0KVxuICAgICAgb2Zmc2V0ICs9IHZhcmludC5kZWNvZGUuYnl0ZXNcbiAgICAgIHZhciB0YWcgPSBwcmVmaXggPj4gM1xuICAgICAgc3dpdGNoICh0YWcpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICBvYmoubWVzc2FnZSA9IGVuY1swXS5kZWNvZGUoYnVmLCBvZmZzZXQpXG4gICAgICAgIG9mZnNldCArPSBlbmNbMF0uZGVjb2RlLmJ5dGVzXG4gICAgICAgIGZvdW5kMCA9IHRydWVcbiAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICBvYmouc3RhY2sgPSBlbmNbMF0uZGVjb2RlKGJ1Ziwgb2Zmc2V0KVxuICAgICAgICBvZmZzZXQgKz0gZW5jWzBdLmRlY29kZS5ieXRlc1xuICAgICAgICBmb3VuZDEgPSB0cnVlXG4gICAgICAgIGJyZWFrXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIG9mZnNldCA9IHNraXAocHJlZml4ICYgNywgYnVmLCBvZmZzZXQpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRlZmluZVN0YXQgKCkge1xuICB2YXIgZW5jID0gW1xuICAgIGVuY29kaW5ncy52YXJpbnRcbiAgXVxuXG4gIFN0YXQuZW5jb2RpbmdMZW5ndGggPSBlbmNvZGluZ0xlbmd0aFxuICBTdGF0LmVuY29kZSA9IGVuY29kZVxuICBTdGF0LmRlY29kZSA9IGRlY29kZVxuXG4gIGZ1bmN0aW9uIGVuY29kaW5nTGVuZ3RoIChvYmopIHtcbiAgICB2YXIgbGVuZ3RoID0gMFxuICAgIGlmICghZGVmaW5lZChvYmoubW9kZSkpIHRocm93IG5ldyBFcnJvcihcIm1vZGUgaXMgcmVxdWlyZWRcIilcbiAgICB2YXIgbGVuID0gZW5jWzBdLmVuY29kaW5nTGVuZ3RoKG9iai5tb2RlKVxuICAgIGxlbmd0aCArPSAxICsgbGVuXG4gICAgaWYgKGRlZmluZWQob2JqLnVpZCkpIHtcbiAgICAgIHZhciBsZW4gPSBlbmNbMF0uZW5jb2RpbmdMZW5ndGgob2JqLnVpZClcbiAgICAgIGxlbmd0aCArPSAxICsgbGVuXG4gICAgfVxuICAgIGlmIChkZWZpbmVkKG9iai5naWQpKSB7XG4gICAgICB2YXIgbGVuID0gZW5jWzBdLmVuY29kaW5nTGVuZ3RoKG9iai5naWQpXG4gICAgICBsZW5ndGggKz0gMSArIGxlblxuICAgIH1cbiAgICBpZiAoZGVmaW5lZChvYmouc2l6ZSkpIHtcbiAgICAgIHZhciBsZW4gPSBlbmNbMF0uZW5jb2RpbmdMZW5ndGgob2JqLnNpemUpXG4gICAgICBsZW5ndGggKz0gMSArIGxlblxuICAgIH1cbiAgICBpZiAoZGVmaW5lZChvYmouYmxvY2tzKSkge1xuICAgICAgdmFyIGxlbiA9IGVuY1swXS5lbmNvZGluZ0xlbmd0aChvYmouYmxvY2tzKVxuICAgICAgbGVuZ3RoICs9IDEgKyBsZW5cbiAgICB9XG4gICAgaWYgKGRlZmluZWQob2JqLm9mZnNldCkpIHtcbiAgICAgIHZhciBsZW4gPSBlbmNbMF0uZW5jb2RpbmdMZW5ndGgob2JqLm9mZnNldClcbiAgICAgIGxlbmd0aCArPSAxICsgbGVuXG4gICAgfVxuICAgIGlmIChkZWZpbmVkKG9iai5ieXRlT2Zmc2V0KSkge1xuICAgICAgdmFyIGxlbiA9IGVuY1swXS5lbmNvZGluZ0xlbmd0aChvYmouYnl0ZU9mZnNldClcbiAgICAgIGxlbmd0aCArPSAxICsgbGVuXG4gICAgfVxuICAgIGlmIChkZWZpbmVkKG9iai5tdGltZSkpIHtcbiAgICAgIHZhciBsZW4gPSBlbmNbMF0uZW5jb2RpbmdMZW5ndGgob2JqLm10aW1lKVxuICAgICAgbGVuZ3RoICs9IDEgKyBsZW5cbiAgICB9XG4gICAgaWYgKGRlZmluZWQob2JqLmN0aW1lKSkge1xuICAgICAgdmFyIGxlbiA9IGVuY1swXS5lbmNvZGluZ0xlbmd0aChvYmouY3RpbWUpXG4gICAgICBsZW5ndGggKz0gMSArIGxlblxuICAgIH1cbiAgICByZXR1cm4gbGVuZ3RoXG4gIH1cblxuICBmdW5jdGlvbiBlbmNvZGUgKG9iaiwgYnVmLCBvZmZzZXQpIHtcbiAgICBpZiAoIW9mZnNldCkgb2Zmc2V0ID0gMFxuICAgIGlmICghYnVmKSBidWYgPSBCdWZmZXIuYWxsb2NVbnNhZmUoZW5jb2RpbmdMZW5ndGgob2JqKSlcbiAgICB2YXIgb2xkT2Zmc2V0ID0gb2Zmc2V0XG4gICAgaWYgKCFkZWZpbmVkKG9iai5tb2RlKSkgdGhyb3cgbmV3IEVycm9yKFwibW9kZSBpcyByZXF1aXJlZFwiKVxuICAgIGJ1ZltvZmZzZXQrK10gPSA4XG4gICAgZW5jWzBdLmVuY29kZShvYmoubW9kZSwgYnVmLCBvZmZzZXQpXG4gICAgb2Zmc2V0ICs9IGVuY1swXS5lbmNvZGUuYnl0ZXNcbiAgICBpZiAoZGVmaW5lZChvYmoudWlkKSkge1xuICAgICAgYnVmW29mZnNldCsrXSA9IDE2XG4gICAgICBlbmNbMF0uZW5jb2RlKG9iai51aWQsIGJ1Ziwgb2Zmc2V0KVxuICAgICAgb2Zmc2V0ICs9IGVuY1swXS5lbmNvZGUuYnl0ZXNcbiAgICB9XG4gICAgaWYgKGRlZmluZWQob2JqLmdpZCkpIHtcbiAgICAgIGJ1ZltvZmZzZXQrK10gPSAyNFxuICAgICAgZW5jWzBdLmVuY29kZShvYmouZ2lkLCBidWYsIG9mZnNldClcbiAgICAgIG9mZnNldCArPSBlbmNbMF0uZW5jb2RlLmJ5dGVzXG4gICAgfVxuICAgIGlmIChkZWZpbmVkKG9iai5zaXplKSkge1xuICAgICAgYnVmW29mZnNldCsrXSA9IDMyXG4gICAgICBlbmNbMF0uZW5jb2RlKG9iai5zaXplLCBidWYsIG9mZnNldClcbiAgICAgIG9mZnNldCArPSBlbmNbMF0uZW5jb2RlLmJ5dGVzXG4gICAgfVxuICAgIGlmIChkZWZpbmVkKG9iai5ibG9ja3MpKSB7XG4gICAgICBidWZbb2Zmc2V0KytdID0gNDBcbiAgICAgIGVuY1swXS5lbmNvZGUob2JqLmJsb2NrcywgYnVmLCBvZmZzZXQpXG4gICAgICBvZmZzZXQgKz0gZW5jWzBdLmVuY29kZS5ieXRlc1xuICAgIH1cbiAgICBpZiAoZGVmaW5lZChvYmoub2Zmc2V0KSkge1xuICAgICAgYnVmW29mZnNldCsrXSA9IDQ4XG4gICAgICBlbmNbMF0uZW5jb2RlKG9iai5vZmZzZXQsIGJ1Ziwgb2Zmc2V0KVxuICAgICAgb2Zmc2V0ICs9IGVuY1swXS5lbmNvZGUuYnl0ZXNcbiAgICB9XG4gICAgaWYgKGRlZmluZWQob2JqLmJ5dGVPZmZzZXQpKSB7XG4gICAgICBidWZbb2Zmc2V0KytdID0gNTZcbiAgICAgIGVuY1swXS5lbmNvZGUob2JqLmJ5dGVPZmZzZXQsIGJ1Ziwgb2Zmc2V0KVxuICAgICAgb2Zmc2V0ICs9IGVuY1swXS5lbmNvZGUuYnl0ZXNcbiAgICB9XG4gICAgaWYgKGRlZmluZWQob2JqLm10aW1lKSkge1xuICAgICAgYnVmW29mZnNldCsrXSA9IDY0XG4gICAgICBlbmNbMF0uZW5jb2RlKG9iai5tdGltZSwgYnVmLCBvZmZzZXQpXG4gICAgICBvZmZzZXQgKz0gZW5jWzBdLmVuY29kZS5ieXRlc1xuICAgIH1cbiAgICBpZiAoZGVmaW5lZChvYmouY3RpbWUpKSB7XG4gICAgICBidWZbb2Zmc2V0KytdID0gNzJcbiAgICAgIGVuY1swXS5lbmNvZGUob2JqLmN0aW1lLCBidWYsIG9mZnNldClcbiAgICAgIG9mZnNldCArPSBlbmNbMF0uZW5jb2RlLmJ5dGVzXG4gICAgfVxuICAgIGVuY29kZS5ieXRlcyA9IG9mZnNldCAtIG9sZE9mZnNldFxuICAgIHJldHVybiBidWZcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZSAoYnVmLCBvZmZzZXQsIGVuZCkge1xuICAgIGlmICghb2Zmc2V0KSBvZmZzZXQgPSAwXG4gICAgaWYgKCFlbmQpIGVuZCA9IGJ1Zi5sZW5ndGhcbiAgICBpZiAoIShlbmQgPD0gYnVmLmxlbmd0aCAmJiBvZmZzZXQgPD0gYnVmLmxlbmd0aCkpIHRocm93IG5ldyBFcnJvcihcIkRlY29kZWQgbWVzc2FnZSBpcyBub3QgdmFsaWRcIilcbiAgICB2YXIgb2xkT2Zmc2V0ID0gb2Zmc2V0XG4gICAgdmFyIG9iaiA9IHtcbiAgICAgIG1vZGU6IDAsXG4gICAgICB1aWQ6IDAsXG4gICAgICBnaWQ6IDAsXG4gICAgICBzaXplOiAwLFxuICAgICAgYmxvY2tzOiAwLFxuICAgICAgb2Zmc2V0OiAwLFxuICAgICAgYnl0ZU9mZnNldDogMCxcbiAgICAgIG10aW1lOiAwLFxuICAgICAgY3RpbWU6IDBcbiAgICB9XG4gICAgdmFyIGZvdW5kMCA9IGZhbHNlXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmIChlbmQgPD0gb2Zmc2V0KSB7XG4gICAgICAgIGlmICghZm91bmQwKSB0aHJvdyBuZXcgRXJyb3IoXCJEZWNvZGVkIG1lc3NhZ2UgaXMgbm90IHZhbGlkXCIpXG4gICAgICAgIGRlY29kZS5ieXRlcyA9IG9mZnNldCAtIG9sZE9mZnNldFxuICAgICAgICByZXR1cm4gb2JqXG4gICAgICB9XG4gICAgICB2YXIgcHJlZml4ID0gdmFyaW50LmRlY29kZShidWYsIG9mZnNldClcbiAgICAgIG9mZnNldCArPSB2YXJpbnQuZGVjb2RlLmJ5dGVzXG4gICAgICB2YXIgdGFnID0gcHJlZml4ID4+IDNcbiAgICAgIHN3aXRjaCAodGFnKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgb2JqLm1vZGUgPSBlbmNbMF0uZGVjb2RlKGJ1Ziwgb2Zmc2V0KVxuICAgICAgICBvZmZzZXQgKz0gZW5jWzBdLmRlY29kZS5ieXRlc1xuICAgICAgICBmb3VuZDAgPSB0cnVlXG4gICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgb2JqLnVpZCA9IGVuY1swXS5kZWNvZGUoYnVmLCBvZmZzZXQpXG4gICAgICAgIG9mZnNldCArPSBlbmNbMF0uZGVjb2RlLmJ5dGVzXG4gICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgb2JqLmdpZCA9IGVuY1swXS5kZWNvZGUoYnVmLCBvZmZzZXQpXG4gICAgICAgIG9mZnNldCArPSBlbmNbMF0uZGVjb2RlLmJ5dGVzXG4gICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgb2JqLnNpemUgPSBlbmNbMF0uZGVjb2RlKGJ1Ziwgb2Zmc2V0KVxuICAgICAgICBvZmZzZXQgKz0gZW5jWzBdLmRlY29kZS5ieXRlc1xuICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDU6XG4gICAgICAgIG9iai5ibG9ja3MgPSBlbmNbMF0uZGVjb2RlKGJ1Ziwgb2Zmc2V0KVxuICAgICAgICBvZmZzZXQgKz0gZW5jWzBdLmRlY29kZS5ieXRlc1xuICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDY6XG4gICAgICAgIG9iai5vZmZzZXQgPSBlbmNbMF0uZGVjb2RlKGJ1Ziwgb2Zmc2V0KVxuICAgICAgICBvZmZzZXQgKz0gZW5jWzBdLmRlY29kZS5ieXRlc1xuICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDc6XG4gICAgICAgIG9iai5ieXRlT2Zmc2V0ID0gZW5jWzBdLmRlY29kZShidWYsIG9mZnNldClcbiAgICAgICAgb2Zmc2V0ICs9IGVuY1swXS5kZWNvZGUuYnl0ZXNcbiAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA4OlxuICAgICAgICBvYmoubXRpbWUgPSBlbmNbMF0uZGVjb2RlKGJ1Ziwgb2Zmc2V0KVxuICAgICAgICBvZmZzZXQgKz0gZW5jWzBdLmRlY29kZS5ieXRlc1xuICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDk6XG4gICAgICAgIG9iai5jdGltZSA9IGVuY1swXS5kZWNvZGUoYnVmLCBvZmZzZXQpXG4gICAgICAgIG9mZnNldCArPSBlbmNbMF0uZGVjb2RlLmJ5dGVzXG4gICAgICAgIGJyZWFrXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIG9mZnNldCA9IHNraXAocHJlZml4ICYgNywgYnVmLCBvZmZzZXQpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRlZmluZUNhbGxiYWNrICgpIHtcbiAgdmFyIGVuYyA9IFtcbiAgICBlbmNvZGluZ3MuaW50MzIsXG4gICAgZW5jb2RpbmdzLnN0cmluZyxcbiAgICBFcnJvcixcbiAgICBTdGF0LFxuICAgIGVuY29kaW5ncy5ieXRlc1xuICBdXG5cbiAgQ2FsbGJhY2suZW5jb2RpbmdMZW5ndGggPSBlbmNvZGluZ0xlbmd0aFxuICBDYWxsYmFjay5lbmNvZGUgPSBlbmNvZGVcbiAgQ2FsbGJhY2suZGVjb2RlID0gZGVjb2RlXG5cbiAgZnVuY3Rpb24gZW5jb2RpbmdMZW5ndGggKG9iaikge1xuICAgIHZhciBsZW5ndGggPSAwXG4gICAgaWYgKCFkZWZpbmVkKG9iai5pZCkpIHRocm93IG5ldyBFcnJvcihcImlkIGlzIHJlcXVpcmVkXCIpXG4gICAgdmFyIGxlbiA9IGVuY1swXS5lbmNvZGluZ0xlbmd0aChvYmouaWQpXG4gICAgbGVuZ3RoICs9IDEgKyBsZW5cbiAgICBpZiAoIWRlZmluZWQob2JqLm5hbWUpKSB0aHJvdyBuZXcgRXJyb3IoXCJuYW1lIGlzIHJlcXVpcmVkXCIpXG4gICAgdmFyIGxlbiA9IGVuY1sxXS5lbmNvZGluZ0xlbmd0aChvYmoubmFtZSlcbiAgICBsZW5ndGggKz0gMSArIGxlblxuICAgIGlmIChkZWZpbmVkKG9iai5lcnJvcikpIHtcbiAgICAgIHZhciBsZW4gPSBlbmNbMl0uZW5jb2RpbmdMZW5ndGgob2JqLmVycm9yKVxuICAgICAgbGVuZ3RoICs9IHZhcmludC5lbmNvZGluZ0xlbmd0aChsZW4pXG4gICAgICBsZW5ndGggKz0gMSArIGxlblxuICAgIH1cbiAgICBpZiAoZGVmaW5lZChvYmouc3RhdCkpIHtcbiAgICAgIHZhciBsZW4gPSBlbmNbM10uZW5jb2RpbmdMZW5ndGgob2JqLnN0YXQpXG4gICAgICBsZW5ndGggKz0gdmFyaW50LmVuY29kaW5nTGVuZ3RoKGxlbilcbiAgICAgIGxlbmd0aCArPSAxICsgbGVuXG4gICAgfVxuICAgIGlmIChkZWZpbmVkKG9iai5kYXRhKSkge1xuICAgICAgdmFyIGxlbiA9IGVuY1s0XS5lbmNvZGluZ0xlbmd0aChvYmouZGF0YSlcbiAgICAgIGxlbmd0aCArPSAxICsgbGVuXG4gICAgfVxuICAgIHJldHVybiBsZW5ndGhcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuY29kZSAob2JqLCBidWYsIG9mZnNldCkge1xuICAgIGlmICghb2Zmc2V0KSBvZmZzZXQgPSAwXG4gICAgaWYgKCFidWYpIGJ1ZiA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShlbmNvZGluZ0xlbmd0aChvYmopKVxuICAgIHZhciBvbGRPZmZzZXQgPSBvZmZzZXRcbiAgICBpZiAoIWRlZmluZWQob2JqLmlkKSkgdGhyb3cgbmV3IEVycm9yKFwiaWQgaXMgcmVxdWlyZWRcIilcbiAgICBidWZbb2Zmc2V0KytdID0gOFxuICAgIGVuY1swXS5lbmNvZGUob2JqLmlkLCBidWYsIG9mZnNldClcbiAgICBvZmZzZXQgKz0gZW5jWzBdLmVuY29kZS5ieXRlc1xuICAgIGlmICghZGVmaW5lZChvYmoubmFtZSkpIHRocm93IG5ldyBFcnJvcihcIm5hbWUgaXMgcmVxdWlyZWRcIilcbiAgICBidWZbb2Zmc2V0KytdID0gMThcbiAgICBlbmNbMV0uZW5jb2RlKG9iai5uYW1lLCBidWYsIG9mZnNldClcbiAgICBvZmZzZXQgKz0gZW5jWzFdLmVuY29kZS5ieXRlc1xuICAgIGlmIChkZWZpbmVkKG9iai5lcnJvcikpIHtcbiAgICAgIGJ1ZltvZmZzZXQrK10gPSAyNlxuICAgICAgdmFyaW50LmVuY29kZShlbmNbMl0uZW5jb2RpbmdMZW5ndGgob2JqLmVycm9yKSwgYnVmLCBvZmZzZXQpXG4gICAgICBvZmZzZXQgKz0gdmFyaW50LmVuY29kZS5ieXRlc1xuICAgICAgZW5jWzJdLmVuY29kZShvYmouZXJyb3IsIGJ1Ziwgb2Zmc2V0KVxuICAgICAgb2Zmc2V0ICs9IGVuY1syXS5lbmNvZGUuYnl0ZXNcbiAgICB9XG4gICAgaWYgKGRlZmluZWQob2JqLnN0YXQpKSB7XG4gICAgICBidWZbb2Zmc2V0KytdID0gMzRcbiAgICAgIHZhcmludC5lbmNvZGUoZW5jWzNdLmVuY29kaW5nTGVuZ3RoKG9iai5zdGF0KSwgYnVmLCBvZmZzZXQpXG4gICAgICBvZmZzZXQgKz0gdmFyaW50LmVuY29kZS5ieXRlc1xuICAgICAgZW5jWzNdLmVuY29kZShvYmouc3RhdCwgYnVmLCBvZmZzZXQpXG4gICAgICBvZmZzZXQgKz0gZW5jWzNdLmVuY29kZS5ieXRlc1xuICAgIH1cbiAgICBpZiAoZGVmaW5lZChvYmouZGF0YSkpIHtcbiAgICAgIGJ1ZltvZmZzZXQrK10gPSA0MlxuICAgICAgZW5jWzRdLmVuY29kZShvYmouZGF0YSwgYnVmLCBvZmZzZXQpXG4gICAgICBvZmZzZXQgKz0gZW5jWzRdLmVuY29kZS5ieXRlc1xuICAgIH1cbiAgICBlbmNvZGUuYnl0ZXMgPSBvZmZzZXQgLSBvbGRPZmZzZXRcbiAgICByZXR1cm4gYnVmXG4gIH1cblxuICBmdW5jdGlvbiBkZWNvZGUgKGJ1Ziwgb2Zmc2V0LCBlbmQpIHtcbiAgICBpZiAoIW9mZnNldCkgb2Zmc2V0ID0gMFxuICAgIGlmICghZW5kKSBlbmQgPSBidWYubGVuZ3RoXG4gICAgaWYgKCEoZW5kIDw9IGJ1Zi5sZW5ndGggJiYgb2Zmc2V0IDw9IGJ1Zi5sZW5ndGgpKSB0aHJvdyBuZXcgRXJyb3IoXCJEZWNvZGVkIG1lc3NhZ2UgaXMgbm90IHZhbGlkXCIpXG4gICAgdmFyIG9sZE9mZnNldCA9IG9mZnNldFxuICAgIHZhciBvYmogPSB7XG4gICAgICBpZDogMCxcbiAgICAgIG5hbWU6IFwiXCIsXG4gICAgICBlcnJvcjogbnVsbCxcbiAgICAgIHN0YXQ6IG51bGwsXG4gICAgICBkYXRhOiBudWxsXG4gICAgfVxuICAgIHZhciBmb3VuZDAgPSBmYWxzZVxuICAgIHZhciBmb3VuZDEgPSBmYWxzZVxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAoZW5kIDw9IG9mZnNldCkge1xuICAgICAgICBpZiAoIWZvdW5kMCB8fCAhZm91bmQxKSB0aHJvdyBuZXcgRXJyb3IoXCJEZWNvZGVkIG1lc3NhZ2UgaXMgbm90IHZhbGlkXCIpXG4gICAgICAgIGRlY29kZS5ieXRlcyA9IG9mZnNldCAtIG9sZE9mZnNldFxuICAgICAgICByZXR1cm4gb2JqXG4gICAgICB9XG4gICAgICB2YXIgcHJlZml4ID0gdmFyaW50LmRlY29kZShidWYsIG9mZnNldClcbiAgICAgIG9mZnNldCArPSB2YXJpbnQuZGVjb2RlLmJ5dGVzXG4gICAgICB2YXIgdGFnID0gcHJlZml4ID4+IDNcbiAgICAgIHN3aXRjaCAodGFnKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgb2JqLmlkID0gZW5jWzBdLmRlY29kZShidWYsIG9mZnNldClcbiAgICAgICAgb2Zmc2V0ICs9IGVuY1swXS5kZWNvZGUuYnl0ZXNcbiAgICAgICAgZm91bmQwID0gdHJ1ZVxuICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgIG9iai5uYW1lID0gZW5jWzFdLmRlY29kZShidWYsIG9mZnNldClcbiAgICAgICAgb2Zmc2V0ICs9IGVuY1sxXS5kZWNvZGUuYnl0ZXNcbiAgICAgICAgZm91bmQxID0gdHJ1ZVxuICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgIHZhciBsZW4gPSB2YXJpbnQuZGVjb2RlKGJ1Ziwgb2Zmc2V0KVxuICAgICAgICBvZmZzZXQgKz0gdmFyaW50LmRlY29kZS5ieXRlc1xuICAgICAgICBvYmouZXJyb3IgPSBlbmNbMl0uZGVjb2RlKGJ1Ziwgb2Zmc2V0LCBvZmZzZXQgKyBsZW4pXG4gICAgICAgIG9mZnNldCArPSBlbmNbMl0uZGVjb2RlLmJ5dGVzXG4gICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgdmFyIGxlbiA9IHZhcmludC5kZWNvZGUoYnVmLCBvZmZzZXQpXG4gICAgICAgIG9mZnNldCArPSB2YXJpbnQuZGVjb2RlLmJ5dGVzXG4gICAgICAgIG9iai5zdGF0ID0gZW5jWzNdLmRlY29kZShidWYsIG9mZnNldCwgb2Zmc2V0ICsgbGVuKVxuICAgICAgICBvZmZzZXQgKz0gZW5jWzNdLmRlY29kZS5ieXRlc1xuICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDU6XG4gICAgICAgIG9iai5kYXRhID0gZW5jWzRdLmRlY29kZShidWYsIG9mZnNldClcbiAgICAgICAgb2Zmc2V0ICs9IGVuY1s0XS5kZWNvZGUuYnl0ZXNcbiAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgb2Zmc2V0ID0gc2tpcChwcmVmaXggJiA3LCBidWYsIG9mZnNldClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVmaW5lZCAodmFsKSB7XG4gIHJldHVybiB2YWwgIT09IG51bGwgJiYgdmFsICE9PSB1bmRlZmluZWQgJiYgKHR5cGVvZiB2YWwgIT09ICdudW1iZXInIHx8ICFpc05hTih2YWwpKVxufVxuIiwiY29uc3Qge1JlcXVlc3QsIENhbGxiYWNrfSA9IHJlcXVpcmUoJy4vcHJvdG8nKVxuXG5mdW5jdGlvbiBOb29wVHJhbnNwb3J0IChuYW1lKSB7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IG5ldyBNYXAoKVxuICB0aGlzLl9pZCA9IDBcbiAgdGhpcy5fbmFtZSA9IG5hbWVcbn1cblxuLyoqXG4gKiBDYWxsZWQgd2l0aCBkYXRhIHRvIGJlIHNlbnRcbiAqIEBwYXJhbSB7QnVmZmVyfSBkYXRhXG4gKi9cbk5vb3BUcmFuc3BvcnQucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICB0aGlzLm9ubWVzc2FnZShDYWxsYmFjay5lbmNvZGUoe2lkOiB0aGlzLl9pZCwgZXJyb3I6IG51bGwsIG5hbWU6IHRoaXMuX25hbWV9KSlcbn1cblxuLyoqXG4gKiBDYWxsZWQgd2hlbiBhIG1lc3NhZ2UgaXMgcmVjZWl2ZWRcbiAqIEBwYXJhbSB7YW55fSBkYXRhIC0geW91IG1heSBuZWVkIHRvIHRyYW5zZm9ybSBpdCBpbiBhIEJ1ZmZlci5cbiAqICAgICAgICAgICAgICAgICAgICAgT25jZSBkb25lLCBjYWxsIGBfbmV4dGAgd2l0aCBhIEJ1ZmZlclxuICpcbiAqIEV4YW1wbGU6XG4gKiB0aGlzLl9uZXh0KEJ1ZmZlci5mcm9tKGRhdGEuZGF0YSkpXG4gKi9cbk5vb3BUcmFuc3BvcnQucHJvdG90eXBlLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gIHRoaXMuX25leHQoZGF0YSlcbn1cblxuLyoqXG4gKiBDbG9zZXMgdGhlIHRyYW5zcG9ydFxuICovXG5Ob29wVHJhbnNwb3J0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHt9XG5cbk5vb3BUcmFuc3BvcnQucHJvdG90eXBlLl9uZXh0ID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgZGF0YSA9IENhbGxiYWNrLmRlY29kZShkYXRhKVxuICBpZiAoZGF0YS5uYW1lICE9PSB0aGlzLl9uYW1lKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBjb25zdCByZXF1ZXN0ID0gdGhpcy5fY2FsbGJhY2tzLmdldChkYXRhLmlkKVxuICByZXF1ZXN0LmNhbGxiYWNrKGRhdGEuZXJyb3IsIGRhdGEuc3RhdCA/IGRhdGEuc3RhdCA6IGRhdGEuZGF0YSlcbn1cblxuTm9vcFRyYW5zcG9ydC5wcm90b3R5cGUuX3F1ZXVlID0gZnVuY3Rpb24gKHJlcXVlc3QsIG9yaWdpbikge1xuICBjb25zdCBuZXh0ID0gKyt0aGlzLl9pZFxuICByZXF1ZXN0Lm5hbWUgPSB0aGlzLl9uYW1lXG4gIHJlcXVlc3QuaWQgPSBuZXh0XG4gIHRoaXMuX2NhbGxiYWNrcy5zZXQobmV4dCwgb3JpZ2luKVxuICB0aGlzLnNlbmQoUmVxdWVzdC5lbmNvZGUocmVxdWVzdCkpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTm9vcFRyYW5zcG9ydFxuIiwiY29uc3QgTm9vcFRyYW5zcG9ydCA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydCcpXG5cbmZ1bmN0aW9uIFN0cmVhbVRyYW5zcG9ydCAobmFtZSwgc3RyZWFtKSB7XG4gIE5vb3BUcmFuc3BvcnQuY2FsbCh0aGlzLCBuYW1lKVxuICB0aGlzLl9zdHJlYW0gPSBzdHJlYW1cbiAgdGhpcy5fc3RyZWFtLm9uKCdkYXRhJywgKGRhdGEpID0+IHRoaXMuX25leHQoZGF0YSkpXG59XG5cblN0cmVhbVRyYW5zcG9ydC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE5vb3BUcmFuc3BvcnQucHJvdG90eXBlKVxuXG5TdHJlYW1UcmFuc3BvcnQucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICB0aGlzLl9zdHJlYW0ud3JpdGUoZGF0YSlcbn1cblxuU3RyZWFtVHJhbnNwb3J0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5fc29jay5jbG9zZSgpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyZWFtVHJhbnNwb3J0XG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJylcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJylcblxudmFyIE5PVF9SRUFEQUJMRSA9IGRlZmF1bHRJbXBsKG5ldyBFcnJvcignTm90IHJlYWRhYmxlJykpXG52YXIgTk9UX1dSSVRBQkxFID0gZGVmYXVsdEltcGwobmV3IEVycm9yKCdOb3Qgd3JpdGFibGUnKSlcbnZhciBOT1RfREVMRVRBQkxFID0gZGVmYXVsdEltcGwobmV3IEVycm9yKCdOb3QgZGVsZXRhYmxlJykpXG52YXIgTk9UX1NUQVRBQkxFID0gZGVmYXVsdEltcGwobmV3IEVycm9yKCdOb3Qgc3RhdGFibGUnKSlcbnZhciBOT19PUEVOX1JFQURBQkxFID0gZGVmYXVsdEltcGwobmV3IEVycm9yKCdObyByZWFkb25seSBvcGVuJykpXG5cbm1vZHVsZS5leHBvcnRzID0gUmFuZG9tQWNjZXNzXG5cbmZ1bmN0aW9uIFJhbmRvbUFjY2VzcyAob3B0cykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmFuZG9tQWNjZXNzKSkgcmV0dXJuIG5ldyBSYW5kb21BY2Nlc3Mob3B0cylcbiAgZXZlbnRzLkV2ZW50RW1pdHRlci5jYWxsKHRoaXMpXG5cbiAgdGhpcy5fcXVldWVkID0gW11cbiAgdGhpcy5fcGVuZGluZyA9IDBcbiAgdGhpcy5fbmVlZHNPcGVuID0gdHJ1ZVxuXG4gIHRoaXMub3BlbmVkID0gZmFsc2VcbiAgdGhpcy5jbG9zZWQgPSBmYWxzZVxuICB0aGlzLmRlc3Ryb3llZCA9IGZhbHNlXG5cbiAgaWYgKG9wdHMpIHtcbiAgICBpZiAob3B0cy5vcGVuUmVhZG9ubHkpIHRoaXMuX29wZW5SZWFkb25seSA9IG9wdHMub3BlblJlYWRvbmx5XG4gICAgaWYgKG9wdHMub3BlbikgdGhpcy5fb3BlbiA9IG9wdHMub3BlblxuICAgIGlmIChvcHRzLnJlYWQpIHRoaXMuX3JlYWQgPSBvcHRzLnJlYWRcbiAgICBpZiAob3B0cy53cml0ZSkgdGhpcy5fd3JpdGUgPSBvcHRzLndyaXRlXG4gICAgaWYgKG9wdHMuZGVsKSB0aGlzLl9kZWwgPSBvcHRzLmRlbFxuICAgIGlmIChvcHRzLnN0YXQpIHRoaXMuX3N0YXQgPSBvcHRzLnN0YXRcbiAgICBpZiAob3B0cy5jbG9zZSkgdGhpcy5fY2xvc2UgPSBvcHRzLmNsb3NlXG4gICAgaWYgKG9wdHMuZGVzdHJveSkgdGhpcy5fZGVzdHJveSA9IG9wdHMuZGVzdHJveVxuICB9XG5cbiAgdGhpcy5wcmVmZXJSZWFkb25seSA9IHRoaXMuX29wZW5SZWFkb25seSAhPT0gTk9fT1BFTl9SRUFEQUJMRVxuICB0aGlzLnJlYWRhYmxlID0gdGhpcy5fcmVhZCAhPT0gTk9UX1JFQURBQkxFXG4gIHRoaXMud3JpdGFibGUgPSB0aGlzLl93cml0ZSAhPT0gTk9UX1dSSVRBQkxFXG4gIHRoaXMuZGVsZXRhYmxlID0gdGhpcy5fZGVsICE9PSBOT1RfREVMRVRBQkxFXG4gIHRoaXMuc3RhdGFibGUgPSB0aGlzLl9zdGF0ICE9PSBOT1RfU1RBVEFCTEVcbn1cblxuaW5oZXJpdHMoUmFuZG9tQWNjZXNzLCBldmVudHMuRXZlbnRFbWl0dGVyKVxuXG5SYW5kb21BY2Nlc3MucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbiAoY2IpIHtcbiAgaWYgKCFjYikgY2IgPSBub29wXG4gIGlmICh0aGlzLm9wZW5lZCAmJiAhdGhpcy5fbmVlZHNPcGVuKSByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhjYiwgbnVsbClcbiAgcXVldWVBbmRSdW4odGhpcywgbmV3IFJlcXVlc3QodGhpcywgMCwgMCwgMCwgbnVsbCwgY2IpKVxufVxuXG5SYW5kb21BY2Nlc3MucHJvdG90eXBlLl9vcGVuID0gZGVmYXVsdEltcGwobnVsbClcblJhbmRvbUFjY2Vzcy5wcm90b3R5cGUuX29wZW5SZWFkb25seSA9IE5PX09QRU5fUkVBREFCTEVcblxuUmFuZG9tQWNjZXNzLnByb3RvdHlwZS5yZWFkID0gZnVuY3Rpb24gKG9mZnNldCwgc2l6ZSwgY2IpIHtcbiAgdGhpcy5ydW4obmV3IFJlcXVlc3QodGhpcywgMSwgb2Zmc2V0LCBzaXplLCBudWxsLCBjYikpXG59XG5cblJhbmRvbUFjY2Vzcy5wcm90b3R5cGUuX3JlYWQgPSBOT1RfUkVBREFCTEVcblxuUmFuZG9tQWNjZXNzLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIChvZmZzZXQsIGRhdGEsIGNiKSB7XG4gIGlmICghY2IpIGNiID0gbm9vcFxuICBvcGVuV3JpdGFibGUodGhpcylcbiAgdGhpcy5ydW4obmV3IFJlcXVlc3QodGhpcywgMiwgb2Zmc2V0LCBkYXRhLmxlbmd0aCwgZGF0YSwgY2IpKVxufVxuXG5SYW5kb21BY2Nlc3MucHJvdG90eXBlLl93cml0ZSA9IE5PVF9XUklUQUJMRVxuXG5SYW5kb21BY2Nlc3MucHJvdG90eXBlLmRlbCA9IGZ1bmN0aW9uIChvZmZzZXQsIHNpemUsIGNiKSB7XG4gIGlmICghY2IpIGNiID0gbm9vcFxuICBvcGVuV3JpdGFibGUodGhpcylcbiAgdGhpcy5ydW4obmV3IFJlcXVlc3QodGhpcywgMywgb2Zmc2V0LCBzaXplLCBudWxsLCBjYikpXG59XG5cblJhbmRvbUFjY2Vzcy5wcm90b3R5cGUuX2RlbCA9IE5PVF9ERUxFVEFCTEVcblxuUmFuZG9tQWNjZXNzLnByb3RvdHlwZS5zdGF0ID0gZnVuY3Rpb24gKGNiKSB7XG4gIHRoaXMucnVuKG5ldyBSZXF1ZXN0KHRoaXMsIDQsIDAsIDAsIG51bGwsIGNiKSlcbn1cblxuUmFuZG9tQWNjZXNzLnByb3RvdHlwZS5fc3RhdCA9IE5PVF9TVEFUQUJMRVxuXG5SYW5kb21BY2Nlc3MucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKGNiKSB7XG4gIGlmICghY2IpIGNiID0gbm9vcFxuICBpZiAodGhpcy5jbG9zZWQpIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGNiLCBudWxsKVxuICBxdWV1ZUFuZFJ1bih0aGlzLCBuZXcgUmVxdWVzdCh0aGlzLCA1LCAwLCAwLCBudWxsLCBjYikpXG59XG5cblJhbmRvbUFjY2Vzcy5wcm90b3R5cGUuX2Nsb3NlID0gZGVmYXVsdEltcGwobnVsbClcblxuUmFuZG9tQWNjZXNzLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKGNiKSB7XG4gIGlmICghY2IpIGNiID0gbm9vcFxuICBpZiAoIXRoaXMuY2xvc2VkKSB0aGlzLmNsb3NlKG5vb3ApXG4gIHF1ZXVlQW5kUnVuKHRoaXMsIG5ldyBSZXF1ZXN0KHRoaXMsIDYsIDAsIDAsIG51bGwsIGNiKSlcbn1cblxuUmFuZG9tQWNjZXNzLnByb3RvdHlwZS5fZGVzdHJveSA9IGRlZmF1bHRJbXBsKG51bGwpXG5cblJhbmRvbUFjY2Vzcy5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHJlcSkge1xuICBpZiAodGhpcy5fbmVlZHNPcGVuKSB0aGlzLm9wZW4obm9vcClcbiAgaWYgKHRoaXMuX3F1ZXVlZC5sZW5ndGgpIHRoaXMuX3F1ZXVlZC5wdXNoKHJlcSlcbiAgZWxzZSByZXEuX3J1bigpXG59XG5cbmZ1bmN0aW9uIG5vb3AgKCkge31cblxuZnVuY3Rpb24gUmVxdWVzdCAoc2VsZiwgdHlwZSwgb2Zmc2V0LCBzaXplLCBkYXRhLCBjYikge1xuICB0aGlzLnR5cGUgPSB0eXBlXG4gIHRoaXMub2Zmc2V0ID0gb2Zmc2V0XG4gIHRoaXMuZGF0YSA9IGRhdGFcbiAgdGhpcy5zaXplID0gc2l6ZVxuICB0aGlzLnN0b3JhZ2UgPSBzZWxmXG5cbiAgdGhpcy5fc3luYyA9IGZhbHNlXG4gIHRoaXMuX2NhbGxiYWNrID0gY2Jcbn1cblxuUmVxdWVzdC5wcm90b3R5cGUuX3VucXVldWUgPSBmdW5jdGlvbiAoZXJyKSB7XG4gIHZhciByYSA9IHRoaXMuc3RvcmFnZVxuICB2YXIgcXVldWVkID0gcmEuX3F1ZXVlZFxuXG4gIGlmICghZXJyKSB7XG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgaWYgKCFyYS5vcGVuZWQpIHtcbiAgICAgICAgICByYS5vcGVuZWQgPSB0cnVlXG4gICAgICAgICAgcmEuZW1pdCgnb3BlbicpXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcblxuICAgICAgY2FzZSA1OlxuICAgICAgICBpZiAoIXJhLmNsb3NlZCkge1xuICAgICAgICAgIHJhLmNsb3NlZCA9IHRydWVcbiAgICAgICAgICByYS5lbWl0KCdjbG9zZScpXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcblxuICAgICAgY2FzZSA2OlxuICAgICAgICBpZiAoIXJhLmRlc3Ryb3llZCkge1xuICAgICAgICAgIHJhLmRlc3Ryb3llZCA9IHRydWVcbiAgICAgICAgICByYS5lbWl0KCdkZXN0cm95JylcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmIChxdWV1ZWQubGVuZ3RoICYmIHF1ZXVlZFswXSA9PT0gdGhpcykgcXVldWVkLnNoaWZ0KClcbiAgaWYgKCEtLXJhLl9wZW5kaW5nICYmIHF1ZXVlZC5sZW5ndGgpIHF1ZXVlZFswXS5fcnVuKClcbn1cblxuUmVxdWVzdC5wcm90b3R5cGUuY2FsbGJhY2sgPSBmdW5jdGlvbiAoZXJyLCB2YWwpIHtcbiAgaWYgKHRoaXMuX3N5bmMpIHJldHVybiBuZXh0VGljayh0aGlzLCBlcnIsIHZhbClcbiAgdGhpcy5fdW5xdWV1ZShlcnIpXG4gIHRoaXMuX2NhbGxiYWNrKGVyciwgdmFsKVxufVxuXG5SZXF1ZXN0LnByb3RvdHlwZS5fb3BlbkFuZE5vdENsb3NlZCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJhID0gdGhpcy5zdG9yYWdlXG4gIGlmIChyYS5vcGVuZWQgJiYgIXJhLmNsb3NlZCkgcmV0dXJuIHRydWVcbiAgaWYgKCFyYS5vcGVuZWQpIG5leHRUaWNrKHRoaXMsIG5ldyBFcnJvcignTm90IG9wZW5lZCcpKVxuICBlbHNlIGlmIChyYS5jbG9zZWQpIG5leHRUaWNrKHRoaXMsIG5ldyBFcnJvcignQ2xvc2VkJykpXG4gIHJldHVybiBmYWxzZVxufVxuXG5SZXF1ZXN0LnByb3RvdHlwZS5fb3BlbiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJhID0gdGhpcy5zdG9yYWdlXG5cbiAgaWYgKHJhLm9wZW5lZCAmJiAhcmEuX25lZWRzT3BlbikgcmV0dXJuIG5leHRUaWNrKHRoaXMsIG51bGwpXG4gIGlmIChyYS5jbG9zZWQpIHJldHVybiBuZXh0VGljayh0aGlzLCBuZXcgRXJyb3IoJ0Nsb3NlZCcpKVxuXG4gIHJhLl9uZWVkc09wZW4gPSBmYWxzZVxuICBpZiAocmEucHJlZmVyUmVhZG9ubHkpIHJhLl9vcGVuUmVhZG9ubHkodGhpcylcbiAgZWxzZSByYS5fb3Blbih0aGlzKVxufVxuXG5SZXF1ZXN0LnByb3RvdHlwZS5fcnVuID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcmEgPSB0aGlzLnN0b3JhZ2VcbiAgcmEuX3BlbmRpbmcrK1xuXG4gIHRoaXMuX3N5bmMgPSB0cnVlXG5cbiAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgICBjYXNlIDA6XG4gICAgICB0aGlzLl9vcGVuKClcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIDE6XG4gICAgICBpZiAodGhpcy5fb3BlbkFuZE5vdENsb3NlZCgpKSByYS5fcmVhZCh0aGlzKVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgMjpcbiAgICAgIGlmICh0aGlzLl9vcGVuQW5kTm90Q2xvc2VkKCkpIHJhLl93cml0ZSh0aGlzKVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgMzpcbiAgICAgIGlmICh0aGlzLl9vcGVuQW5kTm90Q2xvc2VkKCkpIHJhLl9kZWwodGhpcylcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIDQ6XG4gICAgICBpZiAodGhpcy5fb3BlbkFuZE5vdENsb3NlZCgpKSByYS5fc3RhdCh0aGlzKVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgNTpcbiAgICAgIGlmIChyYS5jbG9zZWQgfHwgIXJhLm9wZW5lZCkgbmV4dFRpY2sodGhpcywgbnVsbClcbiAgICAgIGVsc2UgcmEuX2Nsb3NlKHRoaXMpXG4gICAgICBicmVha1xuXG4gICAgY2FzZSA2OlxuICAgICAgaWYgKHJhLmRlc3Ryb3llZCkgbmV4dFRpY2sodGhpcywgbnVsbClcbiAgICAgIGVsc2UgcmEuX2Rlc3Ryb3kodGhpcylcbiAgICAgIGJyZWFrXG4gIH1cblxuICB0aGlzLl9zeW5jID0gZmFsc2Vcbn1cblxuZnVuY3Rpb24gcXVldWVBbmRSdW4gKHNlbGYsIHJlcSkge1xuICBzZWxmLl9xdWV1ZWQucHVzaChyZXEpXG4gIGlmICghc2VsZi5fcGVuZGluZykgcmVxLl9ydW4oKVxufVxuXG5mdW5jdGlvbiBvcGVuV3JpdGFibGUgKHNlbGYpIHtcbiAgaWYgKHNlbGYucHJlZmVyUmVhZG9ubHkpIHtcbiAgICBzZWxmLl9uZWVkc09wZW4gPSB0cnVlXG4gICAgc2VsZi5wcmVmZXJSZWFkb25seSA9IGZhbHNlXG4gIH1cbn1cblxuZnVuY3Rpb24gZGVmYXVsdEltcGwgKGVycikge1xuICByZXR1cm4gb3ZlcnJpZGFibGVcblxuICBmdW5jdGlvbiBvdmVycmlkYWJsZSAocmVxKSB7XG4gICAgbmV4dFRpY2socmVxLCBlcnIpXG4gIH1cbn1cblxuZnVuY3Rpb24gbmV4dFRpY2sgKHJlcSwgZXJyLCB2YWwpIHtcbiAgcHJvY2Vzcy5uZXh0VGljayhuZXh0VGlja0NhbGxiYWNrLCByZXEsIGVyciwgdmFsKVxufVxuXG5mdW5jdGlvbiBuZXh0VGlja0NhbGxiYWNrIChyZXEsIGVyciwgdmFsKSB7XG4gIHJlcS5jYWxsYmFjayhlcnIsIHZhbClcbn1cbiIsInZhciB2YXJpbnQgPSByZXF1aXJlKCd2YXJpbnQnKVxuZXhwb3J0cy5lbmNvZGUgPSBmdW5jdGlvbiBlbmNvZGUgKHYsIGIsIG8pIHtcbiAgdiA9IHYgPj0gMCA/IHYqMiA6IHYqLTIgLSAxXG4gIHZhciByID0gdmFyaW50LmVuY29kZSh2LCBiLCBvKVxuICBlbmNvZGUuYnl0ZXMgPSB2YXJpbnQuZW5jb2RlLmJ5dGVzXG4gIHJldHVybiByXG59XG5leHBvcnRzLmRlY29kZSA9IGZ1bmN0aW9uIGRlY29kZSAoYiwgbykge1xuICB2YXIgdiA9IHZhcmludC5kZWNvZGUoYiwgbylcbiAgZGVjb2RlLmJ5dGVzID0gdmFyaW50LmRlY29kZS5ieXRlc1xuICByZXR1cm4gdiAmIDEgPyAodisxKSAvIC0yIDogdiAvIDJcbn1cblxuZXhwb3J0cy5lbmNvZGluZ0xlbmd0aCA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB2YXJpbnQuZW5jb2RpbmdMZW5ndGgodiA+PSAwID8gdioyIDogdiotMiAtIDEpXG59XG4iLCJ2YXIgbmV4dFRpY2sgPSByZXF1aXJlKCdwcm9jZXNzL2Jyb3dzZXIuanMnKS5uZXh0VGljaztcbnZhciBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseTtcbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBpbW1lZGlhdGVJZHMgPSB7fTtcbnZhciBuZXh0SW1tZWRpYXRlSWQgPSAwO1xuXG4vLyBET00gQVBJcywgZm9yIGNvbXBsZXRlbmVzc1xuXG5leHBvcnRzLnNldFRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0VGltZW91dCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhclRpbWVvdXQpO1xufTtcbmV4cG9ydHMuc2V0SW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0SW50ZXJ2YWwsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJJbnRlcnZhbCk7XG59O1xuZXhwb3J0cy5jbGVhclRpbWVvdXQgPVxuZXhwb3J0cy5jbGVhckludGVydmFsID0gZnVuY3Rpb24odGltZW91dCkgeyB0aW1lb3V0LmNsb3NlKCk7IH07XG5cbmZ1bmN0aW9uIFRpbWVvdXQoaWQsIGNsZWFyRm4pIHtcbiAgdGhpcy5faWQgPSBpZDtcbiAgdGhpcy5fY2xlYXJGbiA9IGNsZWFyRm47XG59XG5UaW1lb3V0LnByb3RvdHlwZS51bnJlZiA9IFRpbWVvdXQucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge307XG5UaW1lb3V0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9jbGVhckZuLmNhbGwod2luZG93LCB0aGlzLl9pZCk7XG59O1xuXG4vLyBEb2VzIG5vdCBzdGFydCB0aGUgdGltZSwganVzdCBzZXRzIHVwIHRoZSBtZW1iZXJzIG5lZWRlZC5cbmV4cG9ydHMuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSwgbXNlY3MpIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IG1zZWNzO1xufTtcblxuZXhwb3J0cy51bmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IC0xO1xufTtcblxuZXhwb3J0cy5fdW5yZWZBY3RpdmUgPSBleHBvcnRzLmFjdGl2ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXG4gIHZhciBtc2VjcyA9IGl0ZW0uX2lkbGVUaW1lb3V0O1xuICBpZiAobXNlY3MgPj0gMCkge1xuICAgIGl0ZW0uX2lkbGVUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uIG9uVGltZW91dCgpIHtcbiAgICAgIGlmIChpdGVtLl9vblRpbWVvdXQpXG4gICAgICAgIGl0ZW0uX29uVGltZW91dCgpO1xuICAgIH0sIG1zZWNzKTtcbiAgfVxufTtcblxuLy8gVGhhdCdzIG5vdCBob3cgbm9kZS5qcyBpbXBsZW1lbnRzIGl0IGJ1dCB0aGUgZXhwb3NlZCBhcGkgaXMgdGhlIHNhbWUuXG5leHBvcnRzLnNldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHNldEltbWVkaWF0ZSA6IGZ1bmN0aW9uKGZuKSB7XG4gIHZhciBpZCA9IG5leHRJbW1lZGlhdGVJZCsrO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGggPCAyID8gZmFsc2UgOiBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgaW1tZWRpYXRlSWRzW2lkXSA9IHRydWU7XG5cbiAgbmV4dFRpY2soZnVuY3Rpb24gb25OZXh0VGljaygpIHtcbiAgICBpZiAoaW1tZWRpYXRlSWRzW2lkXSkge1xuICAgICAgLy8gZm4uY2FsbCgpIGlzIGZhc3RlciBzbyB3ZSBvcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiB1c2UtY2FzZVxuICAgICAgLy8gQHNlZSBodHRwOi8vanNwZXJmLmNvbS9jYWxsLWFwcGx5LXNlZ3VcbiAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm4uY2FsbChudWxsKTtcbiAgICAgIH1cbiAgICAgIC8vIFByZXZlbnQgaWRzIGZyb20gbGVha2luZ1xuICAgICAgZXhwb3J0cy5jbGVhckltbWVkaWF0ZShpZCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gaWQ7XG59O1xuXG5leHBvcnRzLmNsZWFySW1tZWRpYXRlID0gdHlwZW9mIGNsZWFySW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBjbGVhckltbWVkaWF0ZSA6IGZ1bmN0aW9uKGlkKSB7XG4gIGRlbGV0ZSBpbW1lZGlhdGVJZHNbaWRdO1xufTsiLCIvLyBSZXR1cm5zIGEgd3JhcHBlciBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSB3cmFwcGVkIGNhbGxiYWNrXG4vLyBUaGUgd3JhcHBlciBmdW5jdGlvbiBzaG91bGQgZG8gc29tZSBzdHVmZiwgYW5kIHJldHVybiBhXG4vLyBwcmVzdW1hYmx5IGRpZmZlcmVudCBjYWxsYmFjayBmdW5jdGlvbi5cbi8vIFRoaXMgbWFrZXMgc3VyZSB0aGF0IG93biBwcm9wZXJ0aWVzIGFyZSByZXRhaW5lZCwgc28gdGhhdFxuLy8gZGVjb3JhdGlvbnMgYW5kIHN1Y2ggYXJlIG5vdCBsb3N0IGFsb25nIHRoZSB3YXkuXG5tb2R1bGUuZXhwb3J0cyA9IHdyYXBweVxuZnVuY3Rpb24gd3JhcHB5IChmbiwgY2IpIHtcbiAgaWYgKGZuICYmIGNiKSByZXR1cm4gd3JhcHB5KGZuKShjYilcblxuICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ25lZWQgd3JhcHBlciBmdW5jdGlvbicpXG5cbiAgT2JqZWN0LmtleXMoZm4pLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICB3cmFwcGVyW2tdID0gZm5ba11cbiAgfSlcblxuICByZXR1cm4gd3JhcHBlclxuXG4gIGZ1bmN0aW9uIHdyYXBwZXIoKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV1cbiAgICB9XG4gICAgdmFyIHJldCA9IGZuLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgdmFyIGNiID0gYXJnc1thcmdzLmxlbmd0aC0xXVxuICAgIGlmICh0eXBlb2YgcmV0ID09PSAnZnVuY3Rpb24nICYmIHJldCAhPT0gY2IpIHtcbiAgICAgIE9iamVjdC5rZXlzKGNiKS5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICAgIHJldFtrXSA9IGNiW2tdXG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gcmV0XG4gIH1cbn1cbiIsImNvbnN0IHsgUkFOLCBOb29wVHJhbnNwb3J0LCBSYXNCcmlkZ2UgfSA9IHJlcXVpcmUoJ3JhbmRvbS1hY2Nlc3MtbmV0d29yaycpXG52YXIgcmFuZG9tQWNjZXNzID0gcmVxdWlyZSgncmFuZG9tLWFjY2Vzcy1zdG9yYWdlJylcbmNvbnN0IFJQQyA9IHJlcXVpcmUoJ2ZyYW1lLXJwYycpXG5cbmNvbnN0IEFOWV9PUklHSU4gPSAnKidcblxuY2xhc3MgQ2xpZW50IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGNsaWVudCBmb3IgZnJhbWUtcnBjIGZvciByZWFkaW5nIGRhdCBjb250ZW50XG4gICAqIEBwYXJhbSB7V2luZG93fSB3aW5kb3cgVGhlIHdpbmRvdyB0aGUgY2xpZW50IGlzIHJ1bm5pbmcgaW5cbiAgICogQHBhcmFtIHtXaW5kb3d9IHNlcnZlciBUaGUgd2luZG93IHRoZSBwYXJlbnQgb2YgdGhlIHNlcnZpY2UgaXMgcnVubmluZyBpblxuICAgKi9cbiAgY29uc3RydWN0b3IgKHdpbmRvdywgc2VydmVyKSB7XG4gICAgdGhpcy5fcnBjID0gUlBDKHdpbmRvdywgc2VydmVyLCBBTllfT1JJR0lOLCB0aGlzLl9tZXRob2RzKCkpXG4gIH1cblxuICBnZXRTdG9yYWdlICgpIHtcbiAgICByZXR1cm4gKG5hbWUpID0+IHtcbiAgICAgIHJldHVybiBSQU4obmFtZSwgbmV3IFJQQ1RyYW5zcG9ydChuYW1lLCB0aGlzLl9ycGMpKVxuICAgIH1cbiAgfVxuXG4gIHNlbGVjdEFyY2hpdmUgKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5fcnBjLmNhbGwoJ3NlbGVjdEFyY2hpdmUnLCBvcHRpb25zLCBjYWxsYmFjaylcbiAgfVxuXG4gIGFkZEFyY2hpdmUgKGtleSwgc2VjcmV0S2V5LCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIHRoaXMuX3JwYy5jYWxsKCdhZGRBcmNoaXZlJywga2V5LCBzZWNyZXRLZXksIG9wdGlvbnMsIGNhbGxiYWNrKVxuICB9XG5cbiAgX21ldGhvZHMgKCkge1xuICAgIHJldHVybiB7XG4gICAgICAvLyBDbGllbnQgZG9lc24ndCBwcm92aWRlIGFueSBtZXRob2RzXG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFNlcnZlciB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBzZXJ2ZXIgZm9yIGZyYW1lLXJwYyBmb3Igc2VydmluZyBkYXQgY29udGVudFxuICAgKiBAcGFyYW0ge1dpbmRvd30gd2luZG93ICBUaGUgd2luZG93IHNlcnZpbmcgdGhlIGNvbnRlbnRcbiAgICogQHBhcmFtIHtXaW5kb3d9IGNsaWVudCAgVGhlIGNoaWxkIHdpbmRvdyB1c2luZyB0aGUgc2VydmljZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBTaG91bGQgY29udGFpbiBgc3RvcmFnZWAsIGBzZWxlY3RBcmNoaXZlYCwgYW5kIGBhZGRBcmNoaXZlYCBpbXBsZW1lbnRhdGlvbnNcbiAgICovXG4gIGNvbnN0cnVjdG9yICh3aW5kb3csIGNsaWVudCwgb3B0aW9ucykge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgb3B0aW9ucylcbiAgICAvLyB0aGlzLl93cmFwU3RvcmFnZSgpXG4gICAgdGhpcy5fcnBjID0gUlBDKHdpbmRvdywgY2xpZW50LCBBTllfT1JJR0lOLCB0aGlzLl9tZXRob2RzKCkpXG4gICAgdGhpcy5fYnJpZGdlID0gUmFzQnJpZGdlKChuYW1lKSA9PiB0aGlzLl9nZXRTdG9yYWdlKG5hbWUpKVxuICB9XG5cbiAgLy8gX3dyYXBTdG9yYWdlICgpIHtcbiAgLy8gICBjb25zdCByYXdTdG9yYWdlID0gdGhpcy5zdG9yYWdlXG4gIC8vXG4gIC8vICAgdGhpcy5zdG9yYWdlID0gKG5hbWUpID0+IHtcbiAgLy8gICAgIGNvbnN0IGFjY2VzcyA9IHJhd1N0b3JhZ2UobmFtZSlcbiAgLy8gICAgIHJldHVybiByYW5kb21BY2Nlc3Moe1xuICAvLyAgICAgICBvcGVuOiAocmVxdWVzdCkgPT4ge1xuICAvLyAgICAgICAgIGFjY2Vzcy5vcGVuKHJlcXVlc3QuY2FsbGJhY2suYmluZChyZXF1ZXN0KSlcbiAgLy8gICAgICAgfSxcbiAgLy8gICAgICAgcmVhZDogKHJlcXVlc3QpID0+IHtcbiAgLy8gICAgICAgICBhY2Nlc3MucmVhZChyZXF1ZXN0Lm9mZnNldCwgcmVxdWVzdC5zaXplLCByZXF1ZXN0LmNhbGxiYWNrLmJpbmQocmVxdWVzdCkpXG4gIC8vICAgICAgIH0sXG4gIC8vICAgICAgIHdyaXRlOiAocmVxdWVzdCkgPT4ge1xuICAvLyAgICAgICAgIGFjY2Vzcy53cml0ZShyZXF1ZXN0Lm9mZnNldCwgcmVxdWVzdC5kYXRhLCByZXF1ZXN0LmNhbGxiYWNrLmJpbmQocmVxdWVzdCkpXG4gIC8vICAgICAgIH0sXG4gIC8vICAgICAgIGRlbDogKHJlcXVlc3QpID0+IHtcbiAgLy8gICAgICAgICBhY2Nlc3MuZGVsKHJlcXVlc3Qub2Zmc2V0LCByZXF1ZXN0LnNpemUsIHJlcXVlc3QuY2FsbGJhY2suYmluZChyZXF1ZXN0KSlcbiAgLy8gICAgICAgfSxcbiAgLy8gICAgICAgY2xvc2U6IChyZXF1ZXN0KSA9PiB7XG4gIC8vICAgICAgICAgYWNjZXNzLmNsb3NlKHJlcXVlc3QuY2FsbGJhY2suYmluZChyZXF1ZXN0KSlcbiAgLy8gICAgICAgfSxcbiAgLy8gICAgICAgZGVzdHJveTogKHJlcXVlc3QpID0+IHtcbiAgLy8gICAgICAgICBhY2Nlc3MuZGVzdHJveShyZXF1ZXN0LmNhbGxiYWNrLmJpbmQocmVxdWVzdCkpXG4gIC8vICAgICAgIH1cbiAgLy8gICAgIH0pXG4gIC8vICAgfVxuICAvLyB9XG5cbiAgX2dldFN0b3JhZ2UgKG5hbWUpIHtcbiAgICBjb25zdCBzdG9yYWdlID0gdGhpcy5zdG9yYWdlKG5hbWUpXG4gICAgcmV0dXJuIHN0b3JhZ2VcbiAgfVxuXG4gIF9tZXRob2RzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2VsZWN0QXJjaGl2ZTogKG9wdGlvbnMsIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgIHRoaXMuc2VsZWN0QXJjaGl2ZShvcHRpb25zLCBjYWxsYmFjaylcbiAgICAgIH0sXG4gICAgICBhZGRBcmNoaXZlOiAoa2V5LCBzZWNyZXRLZXksIG9wdGlvbnMsIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgIHRoaXMuYWRkQXJjaGl2ZShrZXksIHNlY3JldEtleSwgb3B0aW9ucywgY2FsbGJhY2spXG4gICAgICB9LFxuICAgICAgc3RvcmFnZTogKG5hbWUsIHJlcXVlc3QsIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgIHRoaXMuX2JyaWRnZShCdWZmZXIuZnJvbShyZXF1ZXN0KSwgY2FsbGJhY2spXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFJQQ1RyYW5zcG9ydCBleHRlbmRzIE5vb3BUcmFuc3BvcnQge1xuICBjb25zdHJ1Y3RvciAobmFtZSwgcnBjKSB7XG4gICAgc3VwZXIobmFtZSlcbiAgICB0aGlzLl9ycGMgPSBycGNcbiAgfVxuICBzZW5kIChyZXF1ZXN0KSB7XG4gICAgdGhpcy5fcnBjLmNhbGwoJ3N0b3JhZ2UnLCB0aGlzLl9uYW1lLCByZXF1ZXN0LCAocmVzcG9uc2UpID0+IHtcbiAgICAgIHRoaXMuX25leHQoQnVmZmVyLmZyb20ocmVzcG9uc2UpKVxuICAgIH0pXG4gIH1cbiAgY2xvc2UgKCkge1xuICAgIC8vIMKvXFxfKOODhClfL8KvXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIENsaWVudDogQ2xpZW50LFxuICBTZXJ2ZXI6IFNlcnZlclxufVxuIiwiIl19
