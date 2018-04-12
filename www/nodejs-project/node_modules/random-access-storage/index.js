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
      if (ra.closed || !ra.opened) return nextTick(this, null)
      ra._close(this)
      break

    case 6:
      if (ra.destroyed) return nextTick(this, null)
      ra._destroy(this)
      break
  }
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

function nextTick (req, err) {
  process.nextTick(nextTickCallback, req, err)
}

function nextTickCallback (req, err) {
  req.callback(err, null)
}
