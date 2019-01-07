(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.test = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
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
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
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
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
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
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
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

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
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
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
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
    if (isInstance(buf, Uint8Array)) {
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
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

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
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
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
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
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
  byteOffset = +byteOffset // Coerce to Number.
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
      : Buffer.from(val, encoding)
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

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":1,"ieee754":3}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){

var json_stringify = require('./src/stringify.js').stringify;
var json_parse     = require('./src/parse.js');
var util           = require('./src/int64_util.js');

module.exports = function(options) {
    return  {
        parse: json_parse(options),
        stringify: json_stringify,
        util: util,
        fromDecimalString: util.fromDecimalString,
        toDecimalString: util.toDecimalString
    }
};
//create the default method members with no options applied for backwards compatibility
module.exports.parse = json_parse();
module.exports.stringify = json_stringify;
module.exports.util = util;
module.exports.fromDecimalString = util.fromDecimalString;
module.exports.toDecimalString = util.toDecimalString;

},{"./src/int64_util.js":5,"./src/parse.js":6,"./src/stringify.js":7}],5:[function(require,module,exports){
(function (Buffer){
/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// This file is copied from the Thrift project under Apache 2.0 license
// There are some changes to variable names and styling
// The other changes are documented before the changes

var Int64 = require('node-int64');

var Int64Util = module.exports = {};

var POW2_24 = Math.pow(2, 24);
var POW2_31 = Math.pow(2, 31);
var POW2_32 = Math.pow(2, 32);
var POW10_11 = Math.pow(10, 11);

Int64Util.toDecimalString = function (i64)
{
    var i64Buffer = i64.buffer;
    var i64Offset = i64.offset;
    if ((!i64Buffer[i64Offset] && !(i64Buffer[i64Offset + 1] & 0xe0)) ||
        (!~i64Buffer[i64Offset] && !~(i64Buffer[i64Offset + 1] & 0xe0)))
    {
        // The magnitude is small enough.
        return i64.toString();
    }
    else
    {
        var negative = i64Buffer[i64Offset] & 0x80;
        if (negative)
        {
            // 2's complement
            var incremented = false;
            var buffer = new Buffer(8);
            for (var i = 7; i >= 0; --i)
            {
                buffer[i] = (~i64Buffer[i64Offset + i] + (incremented ? 0 : 1)) & 0xff;
                incremented |= i64Buffer[i64Offset + i];
            }
            i64Buffer = buffer;
        }
        var high2 = i64Buffer[i64Offset + 1] + (i64Buffer[i64Offset] << 8);
        // Lesser 11 digits with exceeding values but is under 53 bits capacity.
        var low = i64Buffer[i64Offset + 7] + (i64Buffer[i64Offset + 6] << 8) + (i64Buffer[i64Offset + 5] << 16) +
            i64Buffer[i64Offset + 4] * POW2_24 // Bit shift renders 32th bit as sign, so use multiplication
            +
            (i64Buffer[i64Offset + 3] + (i64Buffer[i64Offset + 2] << 8)) * POW2_32 + high2 * 74976710656; // The literal is 2^48 % 10^11
        // 12th digit and greater.
        var high = Math.floor(low / POW10_11) + high2 * 2814; // The literal is 2^48 / 10^11
        // The following if block was added when this file was copied from the Thrift project to fix an issue where 
        // small negative numbers would have unnecessary leading zeros
        if (!high)
        {
            low = String(low % POW10_11).slice(-11);
            return (negative ? '-' : '') + low;
        }
        // Make it exactly 11 with leading zeros.
        low = ('00000000000' + String(low % POW10_11)).slice(-11);
        return (negative ? '-' : '') + String(high) + low;
    }
};

Int64Util.fromDecimalString = function (text)
{
    var negative = text.charAt(0) === '-';
    if (text.length < (negative ? 17 : 16))
    {
        // The magnitude is smaller than 2^53.
        return new Int64(+text);
    }
    else if (text.length > (negative ? 20 : 19))
    {
        throw new RangeError('Too many digits for Int64: ' + text);
    }
    else
    {
        // Most significant (up to 5) digits
        var high5 = +text.slice(negative ? 1 : 0, -15);
        var low = +text.slice(-15) + high5 * 2764472320; // The literal is 10^15 % 2^32
        var high = Math.floor(low / POW2_32) + high5 * 232830; // The literal is 10^15 / 2^&32
        low = low % POW2_32;
        // The equality operators were changed to '===' from '==' when this file was copied from the Thrift project
        if (high >= POW2_31 &&
            !(negative && high === POW2_31 && low === 0) // Allow minimum Int64
        )
        {
            throw new RangeError('The magnitude is too large for Int64.');
        }
        if (negative)
        {
            // 2's complement
            high = ~high;
            if (low === 0)
            {
                high = (high + 1) & 0xffffffff;
            }
            else
            {
                low = ~low + 1;
            }
            high = 0x80000000 | high;
        }
        return new Int64(high, low);
    }
};

}).call(this,require("buffer").Buffer)
},{"buffer":2,"node-int64":8}],6:[function(require,module,exports){
/*
    json_parse.js
    2012-06-20
    Public Domain.
    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    This file creates a json_parse function.
    During create you can (optionally) specify some behavioural switches
        require('json-long')
    The resulting function follows this signature:
        json_parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.
            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.
            Example:
            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.
            myData = json_parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });
    This is a reference implementation. You are free to copy, modify, or
    redistribute.
    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html
    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*members "", "\"", "\/", "\\", at, b, call, charAt, f, fromCharCode,
    hasOwnProperty, message, n, name, prototype, push, r, t, text
*/

var Int64Util = null;
var json_parse = function (options) {
    "use strict";

// This is a function that can parse a JSON text, producing a JavaScript
// data structure. It is a simple, recursive descent parser. It does not use
// eval or regular expressions, so it can be used as a model for implementing
// a JSON parser in other languages.

// We are defining the function inside of another function to avoid creating
// global variables.


    var at,     // The index of the current character
        ch,     // The current character
        escapee = {
            '"':  '"',
            '\\': '\\',
            '/':  '/',
            b:    '\b',
            f:    '\f',
            n:    '\n',
            r:    '\r',
            t:    '\t'
        },
        text,

        error = function (m) {

// Call error when something is wrong.

            throw {
                name:    'SyntaxError',
                message: m,
                at:      at,
                text:    text
            };
        },

        next = function (c) {

// If a c parameter is provided, verify that it matches the current character.

            if (c && c !== ch) {
                error("Expected '" + c + "' instead of '" + ch + "'");
            }

// Get the next character. When there are no more characters,
// return the empty string.

            ch = text.charAt(at);
            at += 1;
            return ch;
        },

        number = function () {
// Parse a number value.
            var isFloat = false;
            var number,
                string = '';

            if (ch === '-') {
                string = '-';
                next('-');
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
            if (ch === '.') {
                isFloat = true;
                string += '.';
                while (next() && ch >= '0' && ch <= '9') {
                    string += ch;
                }
            }
            if (ch === 'e' || ch === 'E') {
                isFloat = true;
                string += ch;
                next();
                if (ch === '-' || ch === '+') {
                    string += ch;
                    next();
                }
                while (ch >= '0' && ch <= '9') {
                    string += ch;
                    next();
                }
            }
            number = +string;
            if (!isFinite(number)) {
                error("Bad number");
            } else {
                if (!isFloat && Number(string).toString() !== string)
                {
                    if (Int64Util == null)
                        Int64Util = require("./int64_util.js");
                    return Int64Util.fromDecimalString(string);
                }
                return number
            }
        },

        string = function () {

// Parse a string value.

            var hex,
                i,
                string = '',
                uffff;

// When parsing for string values, we must look for " and \ characters.

            if (ch === '"') {
                while (next()) {
                    if (ch === '"') {
                        next();
                        return string;
                    }
                    if (ch === '\\') {
                        next();
                        if (ch === 'u') {
                            uffff = 0;
                            for (i = 0; i < 4; i += 1) {
                                hex = parseInt(next(), 16);
                                if (!isFinite(hex)) {
                                    break;
                                }
                                uffff = uffff * 16 + hex;
                            }
                            string += String.fromCharCode(uffff);
                        } else if (typeof escapee[ch] === 'string') {
                            string += escapee[ch];
                        } else {
                            break;
                        }
                    } else {
                        string += ch;
                    }
                }
            }
            error("Bad string");
        },

        white = function () {

// Skip whitespace.

            while (ch && ch <= ' ') {
                next();
            }
        },

        word = function () {

// true, false, or null.

            switch (ch) {
            case 't':
                next('t');
                next('r');
                next('u');
                next('e');
                return true;
            case 'f':
                next('f');
                next('a');
                next('l');
                next('s');
                next('e');
                return false;
            case 'n':
                next('n');
                next('u');
                next('l');
                next('l');
                return null;
            }
            error("Unexpected '" + ch + "'");
        },

        value,  // Place holder for the value function.

        array = function () {

// Parse an array value.

            var array = [];

            if (ch === '[') {
                next('[');
                white();
                if (ch === ']') {
                    next(']');
                    return array;   // empty array
                }
                while (ch) {
                    array.push(value());
                    white();
                    if (ch === ']') {
                        next(']');
                        return array;
                    }
                    next(',');
                    white();
                }
            }
            error("Bad array");
        },

        object = function () {

// Parse an object value.

            var key,
                object = {};

            if (ch === '{') {
                next('{');
                white();
                if (ch === '}') {
                    next('}');
                    return object;   // empty object
                }
                while (ch) {
                    key = string();
                    white();
                    next(':');
                    if (Object.hasOwnProperty.call(object, key)) {
                        error('Duplicate key "' + key + '"');
                    }
                    object[key] = value();
                    white();
                    if (ch === '}') {
                        next('}');
                        return object;
                    }
                    next(',');
                    white();
                }
            }
            error("Bad object");
        };

    value = function () {

// Parse a JSON value. It could be an object, an array, a string, a number,
// or a word.

        white();
        switch (ch) {
        case '{':
            return object();
        case '[':
            return array();
        case '"':
            return string();
        case '-':
            return number();
        default:
            return ch >= '0' && ch <= '9' ? number() : word();
        }
    };

// Return the json_parse function. It will have access to all of the above
// functions and variables.

    return function (source, reviver) {
        var result;

        text = source + '';
        at = 0;
        ch = ' ';
        result = value();
        white();
        if (ch) {
            error("Syntax error");
        }

// If there is a reviver function, we recursively walk the new structure,
// passing each name/value pair to the reviver function for possible
// transformation, starting with a temporary root object that holds the result
// in an empty key. If there is not a reviver function, we simply return the
// result.

        return typeof reviver === 'function'
            ? (function walk(holder, key) {
                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    Object.keys(value).forEach(function(k) {
                        v = walk(value, k);
                        if (v !== undefined) {
                            value[k] = v;
                        } else {
                            delete value[k];
                        }
                    });
                }
                return reviver.call(holder, key, value);
            }({'': result}, ''))
            : result;
    };
}

module.exports = json_parse;

},{"./int64_util.js":5}],7:[function(require,module,exports){
var Int64Util = require('./int64_util.js');

/*
    json2.js
    2013-05-26
    Public Domain.
    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    See http://www.JSON.org/js.html
    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html
    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO NOT CONTROL.
    This file creates a global JSON object containing two methods: stringify and parse.
        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.
            replacer    an optional parameter that determines how object values are stringified for objects. It can be a
                        function or an array of strings.
            space       an optional parameter that specifies the indentation of nested structures. If it is omitted, the
                        text will be packed without extra whitespace. If it is a number, it will specify the number of
                        spaces to indent at each level. If it is a string (such as '\t' or '&nbsp;'), it contains the
                        characters used to indent at each level.
            This method produces a JSON text from a JavaScript value. When an object value is found, if the object
            contains a toJSON method, its toJSON method will be called and the result will be stringified. A toJSON
            method does not serialize: it returns the value represented by the name/value pair that should be
            serialized, or undefined if nothing should be serialized. The toJSON method will be passed the key
            associated with the value, and this will be bound to the value.
            For example, this would serialize Dates as ISO strings.
                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }
                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };
            You can provide an optional replacer method. It will be passed the key and value of each member, with this
            bound to the containing object. The value that is returned from your method will be serialized. If your
            method returns undefined, then the member will be excluded from the serialization. If the replacer parameter
            is an array of strings, then it will be used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are stringified. Values that do not have JSON
            representations, such as undefined or functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use a replacer function to replace those with
            JSON values. JSON.stringify(undefined) returns undefined. The optional space parameter produces a
            stringification of the value that is filled with line breaks and indentation to make it easier to read. If
            the space parameter is a non-empty string, then that string will be used for indentation. If the space
            parameter is a number, then the indentation will be that many spaces.
            Example:
            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'
            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'
            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'
    This is a reference implementation. You are free to copy, modify, or redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply, call, charCodeAt, getUTCDate, getUTCFullYear,
    getUTCHours, getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join, lastIndex, length, parse, prototype,
    push, replace, slice, stringify, test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the methods in a closure to avoid creating global
// variables.

var JSON = module.exports;

var BASE_16 = 16;

(function ()
{
    'use strict';

    var escapable =
        /[\\"\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = { // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string)
    {
        // If the string contains no control characters, no quote characters, and no backslash characters, then we can
        // safely slap some quotes around it. Otherwise we must also replace the offending characters with safe escape
        // sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a)
        {
            var c = meta[a];
            return typeof c === 'string' ?
                c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(BASE_16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder)
    {
        // Produce a string from holder[key].

        var i; // The loop counter.
        var k; // The member key.
        var v; // The member value.
        var length;
        var mind = gap;
        var partial;
        var value = holder[key];
        var isInt64 = true;
        var Int64Keys = ["buffer", "offset"];
        var Int64Types = [Uint8Array, Number];
        var valueKeys = [];

        if (value !== null && value !== undefined)
        {
            valueKeys = Object.keys(value).sort();
            // Since javascript is duck-typed, we check the keys of the object and their types. Built-in types are ok.
            if (valueKeys.length === Int64Keys.length)
            {
                for (var it = 0; isInt64 && it < valueKeys.length; ++it)
                {
                    if ((valueKeys[it] !== Int64Keys[it]) || (!value[valueKeys[it]] instanceof Int64Types[it]))
                    {
                        isInt64 = false;
                        break;
                    }
                }
            }
            else
            {
                isInt64 = false;
            }
        }
        else
        {
            isInt64 = false;
        }

        // If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' && typeof value.toJSON === 'function')
        {
            value = value.toJSON(key);
        }

        // If we were called with a replacer function, then call the replacer to obtain a replacement value.

        if (typeof rep === 'function')
        {
            value = rep.call(holder, key, value);
        }

        // What happens next depends on the value's type.

        switch (typeof value)
        {
        case 'string':
            return quote(value);

        case 'number':

            // JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

            // If the value is a boolean or null, convert it to a string. Note: typeof null does not produce 'null'.
            // The case is included here in the remote chance that this gets fixed someday.

            return String(value);

            // If the type is 'object', we might be dealing with an object or an array or null.

        case 'object':

            // Due to a specification blunder in ECMAScript, typeof null is 'object', so watch out for that case.

            if (!value)
            {
                return 'null';
            }

            if (isInt64)
            {
                return Int64Util.toDecimalString(value);
            }

            // Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

            // Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]')
            {
                // The value is an array. Stringify every element. Use null as a placeholder for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1)
                {
                    partial[i] = str(i, value) || 'null';
                }

                // Join all of the elements together, separated with commas, and wrap them in brackets.

                v = partial.length === 0 ?
                    '[]' :
                    gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

            // If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object')
            {
                length = rep.length;
                for (i = 0; i < length; i += 1)
                {
                    if (typeof rep[i] === 'string')
                    {
                        k = rep[i];
                        v = str(k, value);
                        if (v)
                        {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            else
            {
                // Otherwise, iterate through all of the keys in the object.

                Object.keys(value).forEach(function (k)
                {
                    var v = str(k, value);
                    if (v)
                    {
                        partial.push(quote(k) + (gap ? ': ' : ':') + v);
                    }
                });
            }

            // Join all of the member texts together, separated with commas, and wrap them in braces.

            v = partial.length === 0 ?
                '{}' :
                gap ?
                '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
                '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

    // If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function')
    {
        JSON.stringify = function (value, replacer, space)
        {
            // The stringify method takes a value and an optional replacer, and an optional space parameter, and returns
            // a JSON text. The replacer can be a function that can replace values, or an array of strings that will
            // select the keys. A default replacer method can be provided. Use of the space parameter can produce text
            // that is more easily readable.

            var i;
            gap = '';
            indent = '';

            // If the space parameter is a number, make an indent string containing that many spaces.

            if (typeof space === 'number')
            {
                for (i = 0; i < space; i += 1)
                {
                    indent += ' ';
                }

                // If the space parameter is a string, it will be used as the indent string.

            }
            else if (typeof space === 'string')
            {
                indent = space;
            }

            // If there is a replacer, it must be a function or an array. Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                (typeof replacer !== 'object' || typeof replacer.length !== 'number'))
            {
                throw new Error('the type of the replacer must be a function or an array, found ' + typeof replacer);
            }

            // Make a fake root object containing our value under the key of ''. Return the result of stringifying the
            // value.

            return str('', { '': value });
        };
    }
}());

},{"./int64_util.js":5}],8:[function(require,module,exports){
(function (Buffer){
//     Int64.js
//
//     Copyright (c) 2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

/**
 * Support for handling 64-bit int numbers in Javascript (node.js)
 *
 * JS Numbers are IEEE-754 binary double-precision floats, which limits the
 * range of values that can be represented with integer precision to:
 *
 * 2^^53 <= N <= 2^53
 *
 * Int64 objects wrap a node Buffer that holds the 8-bytes of int64 data.  These
 * objects operate directly on the buffer which means that if they are created
 * using an existing buffer then setting the value will modify the Buffer, and
 * vice-versa.
 *
 * Internal Representation
 *
 * The internal buffer format is Big Endian.  I.e. the most-significant byte is
 * at buffer[0], the least-significant at buffer[7].  For the purposes of
 * converting to/from JS native numbers, the value is assumed to be a signed
 * integer stored in 2's complement form.
 *
 * For details about IEEE-754 see:
 * http://en.wikipedia.org/wiki/Double_precision_floating-point_format
 */

// Useful masks and values for bit twiddling
var MASK31 =  0x7fffffff, VAL31 = 0x80000000;
var MASK32 =  0xffffffff, VAL32 = 0x100000000;

// Map for converting hex octets to strings
var _HEX = [];
for (var i = 0; i < 256; i++) {
  _HEX[i] = (i > 0xF ? '' : '0') + i.toString(16);
}

//
// Int64
//

/**
 * Constructor accepts any of the following argument types:
 *
 * new Int64(buffer[, offset=0]) - Existing Buffer with byte offset
 * new Int64(Uint8Array[, offset=0]) - Existing Uint8Array with a byte offset
 * new Int64(string)             - Hex string (throws if n is outside int64 range)
 * new Int64(number)             - Number (throws if n is outside int64 range)
 * new Int64(hi, lo)             - Raw bits as two 32-bit values
 */
var Int64 = module.exports = function(a1, a2) {
  if (a1 instanceof Buffer) {
    this.buffer = a1;
    this.offset = a2 || 0;
  } else if (Object.prototype.toString.call(a1) == '[object Uint8Array]') {
    // Under Browserify, Buffers can extend Uint8Arrays rather than an
    // instance of Buffer. We could assume the passed in Uint8Array is actually
    // a buffer but that won't handle the case where a raw Uint8Array is passed
    // in. We construct a new Buffer just in case.
    this.buffer = new Buffer(a1);
    this.offset = a2 || 0;
  } else {
    this.buffer = this.buffer || new Buffer(8);
    this.offset = 0;
    this.setValue.apply(this, arguments);
  }
};


// Max integer value that JS can accurately represent
Int64.MAX_INT = Math.pow(2, 53);

// Min integer value that JS can accurately represent
Int64.MIN_INT = -Math.pow(2, 53);

Int64.prototype = {

  constructor: Int64,

  /**
   * Do in-place 2's compliment.  See
   * http://en.wikipedia.org/wiki/Two's_complement
   */
  _2scomp: function() {
    var b = this.buffer, o = this.offset, carry = 1;
    for (var i = o + 7; i >= o; i--) {
      var v = (b[i] ^ 0xff) + carry;
      b[i] = v & 0xff;
      carry = v >> 8;
    }
  },

  /**
   * Set the value. Takes any of the following arguments:
   *
   * setValue(string) - A hexidecimal string
   * setValue(number) - Number (throws if n is outside int64 range)
   * setValue(hi, lo) - Raw bits as two 32-bit values
   */
  setValue: function(hi, lo) {
    var negate = false;
    if (arguments.length == 1) {
      if (typeof(hi) == 'number') {
        // Simplify bitfield retrieval by using abs() value.  We restore sign
        // later
        negate = hi < 0;
        hi = Math.abs(hi);
        lo = hi % VAL32;
        hi = hi / VAL32;
        if (hi > VAL32) throw new RangeError(hi  + ' is outside Int64 range');
        hi = hi | 0;
      } else if (typeof(hi) == 'string') {
        hi = (hi + '').replace(/^0x/, '');
        lo = hi.substr(-8);
        hi = hi.length > 8 ? hi.substr(0, hi.length - 8) : '';
        hi = parseInt(hi, 16);
        lo = parseInt(lo, 16);
      } else {
        throw new Error(hi + ' must be a Number or String');
      }
    }

    // Technically we should throw if hi or lo is outside int32 range here, but
    // it's not worth the effort. Anything past the 32'nd bit is ignored.

    // Copy bytes to buffer
    var b = this.buffer, o = this.offset;
    for (var i = 7; i >= 0; i--) {
      b[o+i] = lo & 0xff;
      lo = i == 4 ? hi : lo >>> 8;
    }

    // Restore sign of passed argument
    if (negate) this._2scomp();
  },

  /**
   * Convert to a native JS number.
   *
   * WARNING: Do not expect this value to be accurate to integer precision for
   * large (positive or negative) numbers!
   *
   * @param allowImprecise If true, no check is performed to verify the
   * returned value is accurate to integer precision.  If false, imprecise
   * numbers (very large positive or negative numbers) will be forced to +/-
   * Infinity.
   */
  toNumber: function(allowImprecise) {
    var b = this.buffer, o = this.offset;

    // Running sum of octets, doing a 2's complement
    var negate = b[o] & 0x80, x = 0, carry = 1;
    for (var i = 7, m = 1; i >= 0; i--, m *= 256) {
      var v = b[o+i];

      // 2's complement for negative numbers
      if (negate) {
        v = (v ^ 0xff) + carry;
        carry = v >> 8;
        v = v & 0xff;
      }

      x += v * m;
    }

    // Return Infinity if we've lost integer precision
    if (!allowImprecise && x >= Int64.MAX_INT) {
      return negate ? -Infinity : Infinity;
    }

    return negate ? -x : x;
  },

  /**
   * Convert to a JS Number. Returns +/-Infinity for values that can't be
   * represented to integer precision.
   */
  valueOf: function() {
    return this.toNumber(false);
  },

  /**
   * Return string value
   *
   * @param radix Just like Number#toString()'s radix
   */
  toString: function(radix) {
    return this.valueOf().toString(radix || 10);
  },

  /**
   * Return a string showing the buffer octets, with MSB on the left.
   *
   * @param sep separator string. default is '' (empty string)
   */
  toOctetString: function(sep) {
    var out = new Array(8);
    var b = this.buffer, o = this.offset;
    for (var i = 0; i < 8; i++) {
      out[i] = _HEX[b[o+i]];
    }
    return out.join(sep || '');
  },

  /**
   * Returns the int64's 8 bytes in a buffer.
   *
   * @param {bool} [rawBuffer=false]  If no offset and this is true, return the internal buffer.  Should only be used if
   *                                  you're discarding the Int64 afterwards, as it breaks encapsulation.
   */
  toBuffer: function(rawBuffer) {
    if (rawBuffer && this.offset === 0) return this.buffer;

    var out = new Buffer(8);
    this.buffer.copy(out, 0, this.offset, this.offset + 8);
    return out;
  },

  /**
   * Copy 8 bytes of int64 into target buffer at target offset.
   *
   * @param {Buffer} targetBuffer       Buffer to copy into.
   * @param {number} [targetOffset=0]   Offset into target buffer.
   */
  copy: function(targetBuffer, targetOffset) {
    this.buffer.copy(targetBuffer, targetOffset || 0, this.offset, this.offset + 8);
  },

  /**
   * Returns a number indicating whether this comes before or after or is the
   * same as the other in sort order.
   *
   * @param {Int64} other  Other Int64 to compare.
   */
  compare: function(other) {

    // If sign bits differ ...
    if ((this.buffer[this.offset] & 0x80) != (other.buffer[other.offset] & 0x80)) {
      return other.buffer[other.offset] - this.buffer[this.offset];
    }

    // otherwise, compare bytes lexicographically
    for (var i = 0; i < 8; i++) {
      if (this.buffer[this.offset+i] !== other.buffer[other.offset+i]) {
        return this.buffer[this.offset+i] - other.buffer[other.offset+i];
      }
    }
    return 0;
  },

  /**
   * Returns a boolean indicating if this integer is equal to other.
   *
   * @param {Int64} other  Other Int64 to compare.
   */
  equals: function(other) {
    return this.compare(other) === 0;
  },

  /**
   * Pretty output in console.log
   */
  inspect: function() {
    return '[Int64 value:' + this + ' octets:' + this.toOctetString(' ') + ']';
  }
};

}).call(this,require("buffer").Buffer)
},{"buffer":2}],9:[function(require,module,exports){
//
// Autogenerated by Thrift Compiler (1.0.0-dev)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//
if (typeof Int64 === 'undefined') {var Int64 = require('node-int64');}


//HELPER FUNCTIONS AND STRUCTURES

ThriftTest.ThriftTest_testVoid_args = function(args) {
    };
ThriftTest.ThriftTest_testVoid_args.prototype = {};
    ThriftTest.ThriftTest_testVoid_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        input.skip(ftype);
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testVoid_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testVoid_args');
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testVoid_result = function(args) {
    };
ThriftTest.ThriftTest_testVoid_result.prototype = {};
    ThriftTest.ThriftTest_testVoid_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        input.skip(ftype);
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testVoid_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testVoid_result');
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testString_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = args.thing;
        }
      }
    };
ThriftTest.ThriftTest_testString_args.prototype = {};
    ThriftTest.ThriftTest_testString_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.STRING) {
            this.thing = input.readString().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testString_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testString_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.STRING, 1);
        output.writeString(this.thing);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testString_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = args.success;
        }
      }
    };
ThriftTest.ThriftTest_testString_result.prototype = {};
    ThriftTest.ThriftTest_testString_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.STRING) {
            this.success = input.readString().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testString_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testString_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.STRING, 0);
        output.writeString(this.success);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testBool_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = args.thing;
        }
      }
    };
ThriftTest.ThriftTest_testBool_args.prototype = {};
    ThriftTest.ThriftTest_testBool_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.BOOL) {
            this.thing = input.readBool().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testBool_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testBool_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.BOOL, 1);
        output.writeBool(this.thing);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testBool_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = args.success;
        }
      }
    };
ThriftTest.ThriftTest_testBool_result.prototype = {};
    ThriftTest.ThriftTest_testBool_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.BOOL) {
            this.success = input.readBool().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testBool_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testBool_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.BOOL, 0);
        output.writeBool(this.success);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testByte_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = args.thing;
        }
      }
    };
ThriftTest.ThriftTest_testByte_args.prototype = {};
    ThriftTest.ThriftTest_testByte_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.BYTE) {
            this.thing = input.readByte().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testByte_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testByte_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.BYTE, 1);
        output.writeByte(this.thing);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testByte_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = args.success;
        }
      }
    };
ThriftTest.ThriftTest_testByte_result.prototype = {};
    ThriftTest.ThriftTest_testByte_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.BYTE) {
            this.success = input.readByte().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testByte_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testByte_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.BYTE, 0);
        output.writeByte(this.success);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testI32_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = args.thing;
        }
      }
    };
ThriftTest.ThriftTest_testI32_args.prototype = {};
    ThriftTest.ThriftTest_testI32_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.I32) {
            this.thing = input.readI32().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testI32_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testI32_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.I32, 1);
        output.writeI32(this.thing);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testI32_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = args.success;
        }
      }
    };
ThriftTest.ThriftTest_testI32_result.prototype = {};
    ThriftTest.ThriftTest_testI32_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.I32) {
            this.success = input.readI32().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testI32_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testI32_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.I32, 0);
        output.writeI32(this.success);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testI64_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = args.thing;
        }
      }
    };
ThriftTest.ThriftTest_testI64_args.prototype = {};
    ThriftTest.ThriftTest_testI64_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.I64) {
            this.thing = input.readI64().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testI64_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testI64_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.I64, 1);
        output.writeI64(this.thing);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testI64_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = args.success;
        }
      }
    };
ThriftTest.ThriftTest_testI64_result.prototype = {};
    ThriftTest.ThriftTest_testI64_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.I64) {
            this.success = input.readI64().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testI64_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testI64_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.I64, 0);
        output.writeI64(this.success);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testDouble_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = args.thing;
        }
      }
    };
ThriftTest.ThriftTest_testDouble_args.prototype = {};
    ThriftTest.ThriftTest_testDouble_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.DOUBLE) {
            this.thing = input.readDouble().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testDouble_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testDouble_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.DOUBLE, 1);
        output.writeDouble(this.thing);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testDouble_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = args.success;
        }
      }
    };
ThriftTest.ThriftTest_testDouble_result.prototype = {};
    ThriftTest.ThriftTest_testDouble_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.DOUBLE) {
            this.success = input.readDouble().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testDouble_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testDouble_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.DOUBLE, 0);
        output.writeDouble(this.success);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testBinary_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = args.thing;
        }
      }
    };
ThriftTest.ThriftTest_testBinary_args.prototype = {};
    ThriftTest.ThriftTest_testBinary_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.STRING) {
            this.thing = input.readBinary().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testBinary_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testBinary_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.STRING, 1);
        output.writeBinary(this.thing);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testBinary_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = args.success;
        }
      }
    };
ThriftTest.ThriftTest_testBinary_result.prototype = {};
    ThriftTest.ThriftTest_testBinary_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.STRING) {
            this.success = input.readBinary().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testBinary_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testBinary_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.STRING, 0);
        output.writeBinary(this.success);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testStruct_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = new ThriftTest.Xtruct(args.thing);
        }
      }
    };
ThriftTest.ThriftTest_testStruct_args.prototype = {};
    ThriftTest.ThriftTest_testStruct_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.STRUCT) {
            this.thing = new ThriftTest.Xtruct();
            this.thing.read(input);
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testStruct_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testStruct_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.STRUCT, 1);
        this.thing.write(output);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testStruct_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = new ThriftTest.Xtruct(args.success);
        }
      }
    };
ThriftTest.ThriftTest_testStruct_result.prototype = {};
    ThriftTest.ThriftTest_testStruct_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.STRUCT) {
            this.success = new ThriftTest.Xtruct();
            this.success.read(input);
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testStruct_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testStruct_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.STRUCT, 0);
        this.success.write(output);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testNest_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = new ThriftTest.Xtruct2(args.thing);
        }
      }
    };
ThriftTest.ThriftTest_testNest_args.prototype = {};
    ThriftTest.ThriftTest_testNest_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.STRUCT) {
            this.thing = new ThriftTest.Xtruct2();
            this.thing.read(input);
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testNest_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testNest_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.STRUCT, 1);
        this.thing.write(output);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testNest_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = new ThriftTest.Xtruct2(args.success);
        }
      }
    };
ThriftTest.ThriftTest_testNest_result.prototype = {};
    ThriftTest.ThriftTest_testNest_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.STRUCT) {
            this.success = new ThriftTest.Xtruct2();
            this.success.read(input);
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testNest_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testNest_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.STRUCT, 0);
        this.success.write(output);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testMap_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = Thrift.copyMap(args.thing, [null]);
        }
      }
    };
ThriftTest.ThriftTest_testMap_args.prototype = {};
    ThriftTest.ThriftTest_testMap_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.MAP) {
            this.thing = {};
            var _rtmp3194 = input.readMapBegin();
            var _size193 = _rtmp3194.size || 0;
            for (var _i195 = 0; _i195 < _size193; ++_i195) {
              if (_i195 > 0 ) {
                if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                  input.rstack.pop();
                }
              }
              var key196 = null;
              var val197 = null;
              key196 = input.readI32().value;
              val197 = input.readI32().value;
              this.thing[key196] = val197;
            }
            input.readMapEnd();
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testMap_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testMap_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.MAP, 1);
        output.writeMapBegin(Thrift.Type.I32, Thrift.Type.I32, Thrift.objectLength(this.thing));
        for (var kiter198 in this.thing) {
          if (this.thing.hasOwnProperty(kiter198)) {
            var viter199 = this.thing[kiter198];
            output.writeI32(kiter198);
            output.writeI32(viter199);
          }
        }
        output.writeMapEnd();
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testMap_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = Thrift.copyMap(args.success, [null]);
        }
      }
    };
ThriftTest.ThriftTest_testMap_result.prototype = {};
    ThriftTest.ThriftTest_testMap_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.MAP) {
            this.success = {};
            var _rtmp3201 = input.readMapBegin();
            var _size200 = _rtmp3201.size || 0;
            for (var _i202 = 0; _i202 < _size200; ++_i202) {
              if (_i202 > 0 ) {
                if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                  input.rstack.pop();
                }
              }
              var key203 = null;
              var val204 = null;
              key203 = input.readI32().value;
              val204 = input.readI32().value;
              this.success[key203] = val204;
            }
            input.readMapEnd();
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testMap_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testMap_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.MAP, 0);
        output.writeMapBegin(Thrift.Type.I32, Thrift.Type.I32, Thrift.objectLength(this.success));
        for (var kiter205 in this.success) {
          if (this.success.hasOwnProperty(kiter205)) {
            var viter206 = this.success[kiter205];
            output.writeI32(kiter205);
            output.writeI32(viter206);
          }
        }
        output.writeMapEnd();
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testStringMap_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = Thrift.copyMap(args.thing, [null]);
        }
      }
    };
ThriftTest.ThriftTest_testStringMap_args.prototype = {};
    ThriftTest.ThriftTest_testStringMap_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.MAP) {
            this.thing = {};
            var _rtmp3208 = input.readMapBegin();
            var _size207 = _rtmp3208.size || 0;
            for (var _i209 = 0; _i209 < _size207; ++_i209) {
              if (_i209 > 0 ) {
                if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                  input.rstack.pop();
                }
              }
              var key210 = null;
              var val211 = null;
              key210 = input.readString().value;
              val211 = input.readString().value;
              this.thing[key210] = val211;
            }
            input.readMapEnd();
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testStringMap_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testStringMap_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.MAP, 1);
        output.writeMapBegin(Thrift.Type.STRING, Thrift.Type.STRING, Thrift.objectLength(this.thing));
        for (var kiter212 in this.thing) {
          if (this.thing.hasOwnProperty(kiter212)) {
            var viter213 = this.thing[kiter212];
            output.writeString(kiter212);
            output.writeString(viter213);
          }
        }
        output.writeMapEnd();
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testStringMap_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = Thrift.copyMap(args.success, [null]);
        }
      }
    };
ThriftTest.ThriftTest_testStringMap_result.prototype = {};
    ThriftTest.ThriftTest_testStringMap_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.MAP) {
            this.success = {};
            var _rtmp3215 = input.readMapBegin();
            var _size214 = _rtmp3215.size || 0;
            for (var _i216 = 0; _i216 < _size214; ++_i216) {
              if (_i216 > 0 ) {
                if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                  input.rstack.pop();
                }
              }
              var key217 = null;
              var val218 = null;
              key217 = input.readString().value;
              val218 = input.readString().value;
              this.success[key217] = val218;
            }
            input.readMapEnd();
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testStringMap_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testStringMap_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.MAP, 0);
        output.writeMapBegin(Thrift.Type.STRING, Thrift.Type.STRING, Thrift.objectLength(this.success));
        for (var kiter219 in this.success) {
          if (this.success.hasOwnProperty(kiter219)) {
            var viter220 = this.success[kiter219];
            output.writeString(kiter219);
            output.writeString(viter220);
          }
        }
        output.writeMapEnd();
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testSet_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = Thrift.copyList(args.thing, [null]);
        }
      }
    };
ThriftTest.ThriftTest_testSet_args.prototype = {};
    ThriftTest.ThriftTest_testSet_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.SET) {
            this.thing = [];
            var _rtmp3222 = input.readSetBegin();
            var _size221 = _rtmp3222.size || 0;
            for (var _i223 = 0; _i223 < _size221; ++_i223) {
              var elem224 = null;
              elem224 = input.readI32().value;
              this.thing.push(elem224);
            }
            input.readSetEnd();
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testSet_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testSet_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.SET, 1);
        output.writeSetBegin(Thrift.Type.I32, this.thing.length);
        for (var iter225 in this.thing) {
          if (this.thing.hasOwnProperty(iter225)) {
            iter225 = this.thing[iter225];
            output.writeI32(iter225);
          }
        }
        output.writeSetEnd();
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testSet_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = Thrift.copyList(args.success, [null]);
        }
      }
    };
ThriftTest.ThriftTest_testSet_result.prototype = {};
    ThriftTest.ThriftTest_testSet_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.SET) {
            this.success = [];
            var _rtmp3227 = input.readSetBegin();
            var _size226 = _rtmp3227.size || 0;
            for (var _i228 = 0; _i228 < _size226; ++_i228) {
              var elem229 = null;
              elem229 = input.readI32().value;
              this.success.push(elem229);
            }
            input.readSetEnd();
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testSet_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testSet_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.SET, 0);
        output.writeSetBegin(Thrift.Type.I32, this.success.length);
        for (var iter230 in this.success) {
          if (this.success.hasOwnProperty(iter230)) {
            iter230 = this.success[iter230];
            output.writeI32(iter230);
          }
        }
        output.writeSetEnd();
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testList_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = Thrift.copyList(args.thing, [null]);
        }
      }
    };
ThriftTest.ThriftTest_testList_args.prototype = {};
    ThriftTest.ThriftTest_testList_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.LIST) {
            this.thing = [];
            var _rtmp3232 = input.readListBegin();
            var _size231 = _rtmp3232.size || 0;
            for (var _i233 = 0; _i233 < _size231; ++_i233) {
              var elem234 = null;
              elem234 = input.readI32().value;
              this.thing.push(elem234);
            }
            input.readListEnd();
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testList_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testList_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.LIST, 1);
        output.writeListBegin(Thrift.Type.I32, this.thing.length);
        for (var iter235 in this.thing) {
          if (this.thing.hasOwnProperty(iter235)) {
            iter235 = this.thing[iter235];
            output.writeI32(iter235);
          }
        }
        output.writeListEnd();
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testList_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = Thrift.copyList(args.success, [null]);
        }
      }
    };
ThriftTest.ThriftTest_testList_result.prototype = {};
    ThriftTest.ThriftTest_testList_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.LIST) {
            this.success = [];
            var _rtmp3237 = input.readListBegin();
            var _size236 = _rtmp3237.size || 0;
            for (var _i238 = 0; _i238 < _size236; ++_i238) {
              var elem239 = null;
              elem239 = input.readI32().value;
              this.success.push(elem239);
            }
            input.readListEnd();
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testList_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testList_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.LIST, 0);
        output.writeListBegin(Thrift.Type.I32, this.success.length);
        for (var iter240 in this.success) {
          if (this.success.hasOwnProperty(iter240)) {
            iter240 = this.success[iter240];
            output.writeI32(iter240);
          }
        }
        output.writeListEnd();
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testEnum_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = args.thing;
        }
      }
    };
ThriftTest.ThriftTest_testEnum_args.prototype = {};
    ThriftTest.ThriftTest_testEnum_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.I32) {
            this.thing = input.readI32().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testEnum_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testEnum_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.I32, 1);
        output.writeI32(this.thing);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testEnum_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = args.success;
        }
      }
    };
ThriftTest.ThriftTest_testEnum_result.prototype = {};
    ThriftTest.ThriftTest_testEnum_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.I32) {
            this.success = input.readI32().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testEnum_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testEnum_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.I32, 0);
        output.writeI32(this.success);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testTypedef_args = function(args) {
      this.thing = null;
      if (args) {
        if (args.thing !== undefined && args.thing !== null) {
          this.thing = args.thing;
        }
      }
    };
ThriftTest.ThriftTest_testTypedef_args.prototype = {};
    ThriftTest.ThriftTest_testTypedef_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.I64) {
            this.thing = input.readI64().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testTypedef_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testTypedef_args');
      if (this.thing !== null && this.thing !== undefined) {
        output.writeFieldBegin('thing', Thrift.Type.I64, 1);
        output.writeI64(this.thing);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testTypedef_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = args.success;
        }
      }
    };
ThriftTest.ThriftTest_testTypedef_result.prototype = {};
    ThriftTest.ThriftTest_testTypedef_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.I64) {
            this.success = input.readI64().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testTypedef_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testTypedef_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.I64, 0);
        output.writeI64(this.success);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testMapMap_args = function(args) {
      this.hello = null;
      if (args) {
        if (args.hello !== undefined && args.hello !== null) {
          this.hello = args.hello;
        }
      }
    };
ThriftTest.ThriftTest_testMapMap_args.prototype = {};
    ThriftTest.ThriftTest_testMapMap_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.I32) {
            this.hello = input.readI32().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testMapMap_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testMapMap_args');
      if (this.hello !== null && this.hello !== undefined) {
        output.writeFieldBegin('hello', Thrift.Type.I32, 1);
        output.writeI32(this.hello);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testMapMap_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = Thrift.copyMap(args.success, [Thrift.copyMap, null]);
        }
      }
    };
ThriftTest.ThriftTest_testMapMap_result.prototype = {};
    ThriftTest.ThriftTest_testMapMap_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.MAP) {
            this.success = {};
            var _rtmp3242 = input.readMapBegin();
            var _size241 = _rtmp3242.size || 0;
            for (var _i243 = 0; _i243 < _size241; ++_i243) {
              if (_i243 > 0 ) {
                if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                  input.rstack.pop();
                }
              }
              var key244 = null;
              var val245 = null;
              key244 = input.readI32().value;
              val245 = {};
              var _rtmp3247 = input.readMapBegin();
              var _size246 = _rtmp3247.size || 0;
              for (var _i248 = 0; _i248 < _size246; ++_i248) {
                if (_i248 > 0 ) {
                  if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                    input.rstack.pop();
                  }
                }
                var key249 = null;
                var val250 = null;
                key249 = input.readI32().value;
                val250 = input.readI32().value;
                val245[key249] = val250;
              }
              input.readMapEnd();
              this.success[key244] = val245;
            }
            input.readMapEnd();
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testMapMap_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testMapMap_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.MAP, 0);
        output.writeMapBegin(Thrift.Type.I32, Thrift.Type.MAP, Thrift.objectLength(this.success));
        for (var kiter251 in this.success) {
          if (this.success.hasOwnProperty(kiter251)) {
            var viter252 = this.success[kiter251];
            output.writeI32(kiter251);
            output.writeMapBegin(Thrift.Type.I32, Thrift.Type.I32, Thrift.objectLength(viter252));
            for (var kiter253 in viter252) {
              if (viter252.hasOwnProperty(kiter253)) {
                var viter254 = viter252[kiter253];
                output.writeI32(kiter253);
                output.writeI32(viter254);
              }
            }
            output.writeMapEnd();
          }
        }
        output.writeMapEnd();
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testInsanity_args = function(args) {
      this.argument = null;
      if (args) {
        if (args.argument !== undefined && args.argument !== null) {
          this.argument = new ThriftTest.Insanity(args.argument);
        }
      }
    };
ThriftTest.ThriftTest_testInsanity_args.prototype = {};
    ThriftTest.ThriftTest_testInsanity_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.STRUCT) {
            this.argument = new ThriftTest.Insanity();
            this.argument.read(input);
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testInsanity_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testInsanity_args');
      if (this.argument !== null && this.argument !== undefined) {
        output.writeFieldBegin('argument', Thrift.Type.STRUCT, 1);
        this.argument.write(output);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testInsanity_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = Thrift.copyMap(args.success, [Thrift.copyMap, ThriftTest.Insanity]);
        }
      }
    };
ThriftTest.ThriftTest_testInsanity_result.prototype = {};
    ThriftTest.ThriftTest_testInsanity_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.MAP) {
            this.success = {};
            var _rtmp3256 = input.readMapBegin();
            var _size255 = _rtmp3256.size || 0;
            for (var _i257 = 0; _i257 < _size255; ++_i257) {
              if (_i257 > 0 ) {
                if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                  input.rstack.pop();
                }
              }
              var key258 = null;
              var val259 = null;
              key258 = input.readI64().value;
              val259 = {};
              var _rtmp3261 = input.readMapBegin();
              var _size260 = _rtmp3261.size || 0;
              for (var _i262 = 0; _i262 < _size260; ++_i262) {
                if (_i262 > 0 ) {
                  if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                    input.rstack.pop();
                  }
                }
                var key263 = null;
                var val264 = null;
                key263 = input.readI32().value;
                val264 = new ThriftTest.Insanity();
                val264.read(input);
                val259[key263] = val264;
              }
              input.readMapEnd();
              this.success[key258] = val259;
            }
            input.readMapEnd();
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testInsanity_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testInsanity_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.MAP, 0);
        output.writeMapBegin(Thrift.Type.I64, Thrift.Type.MAP, Thrift.objectLength(this.success));
        for (var kiter265 in this.success) {
          if (this.success.hasOwnProperty(kiter265)) {
            var viter266 = this.success[kiter265];
            output.writeI64(kiter265);
            output.writeMapBegin(Thrift.Type.I32, Thrift.Type.STRUCT, Thrift.objectLength(viter266));
            for (var kiter267 in viter266) {
              if (viter266.hasOwnProperty(kiter267)) {
                var viter268 = viter266[kiter267];
                output.writeI32(kiter267);
                viter268.write(output);
              }
            }
            output.writeMapEnd();
          }
        }
        output.writeMapEnd();
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testMulti_args = function(args) {
      this.arg0 = null;
      this.arg1 = null;
      this.arg2 = null;
      this.arg3 = null;
      this.arg4 = null;
      this.arg5 = null;
      if (args) {
        if (args.arg0 !== undefined && args.arg0 !== null) {
          this.arg0 = args.arg0;
        }
        if (args.arg1 !== undefined && args.arg1 !== null) {
          this.arg1 = args.arg1;
        }
        if (args.arg2 !== undefined && args.arg2 !== null) {
          this.arg2 = args.arg2;
        }
        if (args.arg3 !== undefined && args.arg3 !== null) {
          this.arg3 = Thrift.copyMap(args.arg3, [null]);
        }
        if (args.arg4 !== undefined && args.arg4 !== null) {
          this.arg4 = args.arg4;
        }
        if (args.arg5 !== undefined && args.arg5 !== null) {
          this.arg5 = args.arg5;
        }
      }
    };
ThriftTest.ThriftTest_testMulti_args.prototype = {};
    ThriftTest.ThriftTest_testMulti_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.BYTE) {
            this.arg0 = input.readByte().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 2:
          if (ftype == Thrift.Type.I32) {
            this.arg1 = input.readI32().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 3:
          if (ftype == Thrift.Type.I64) {
            this.arg2 = input.readI64().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 4:
          if (ftype == Thrift.Type.MAP) {
            this.arg3 = {};
            var _rtmp3270 = input.readMapBegin();
            var _size269 = _rtmp3270.size || 0;
            for (var _i271 = 0; _i271 < _size269; ++_i271) {
              if (_i271 > 0 ) {
                if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                  input.rstack.pop();
                }
              }
              var key272 = null;
              var val273 = null;
              key272 = input.readI16().value;
              val273 = input.readString().value;
              this.arg3[key272] = val273;
            }
            input.readMapEnd();
          } else {
            input.skip(ftype);
          }
          break;
          case 5:
          if (ftype == Thrift.Type.I32) {
            this.arg4 = input.readI32().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 6:
          if (ftype == Thrift.Type.I64) {
            this.arg5 = input.readI64().value;
          } else {
            input.skip(ftype);
          }
          break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testMulti_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testMulti_args');
      if (this.arg0 !== null && this.arg0 !== undefined) {
        output.writeFieldBegin('arg0', Thrift.Type.BYTE, 1);
        output.writeByte(this.arg0);
        output.writeFieldEnd();
      }
      if (this.arg1 !== null && this.arg1 !== undefined) {
        output.writeFieldBegin('arg1', Thrift.Type.I32, 2);
        output.writeI32(this.arg1);
        output.writeFieldEnd();
      }
      if (this.arg2 !== null && this.arg2 !== undefined) {
        output.writeFieldBegin('arg2', Thrift.Type.I64, 3);
        output.writeI64(this.arg2);
        output.writeFieldEnd();
      }
      if (this.arg3 !== null && this.arg3 !== undefined) {
        output.writeFieldBegin('arg3', Thrift.Type.MAP, 4);
        output.writeMapBegin(Thrift.Type.I16, Thrift.Type.STRING, Thrift.objectLength(this.arg3));
        for (var kiter274 in this.arg3) {
          if (this.arg3.hasOwnProperty(kiter274)) {
            var viter275 = this.arg3[kiter274];
            output.writeI16(kiter274);
            output.writeString(viter275);
          }
        }
        output.writeMapEnd();
        output.writeFieldEnd();
      }
      if (this.arg4 !== null && this.arg4 !== undefined) {
        output.writeFieldBegin('arg4', Thrift.Type.I32, 5);
        output.writeI32(this.arg4);
        output.writeFieldEnd();
      }
      if (this.arg5 !== null && this.arg5 !== undefined) {
        output.writeFieldBegin('arg5', Thrift.Type.I64, 6);
        output.writeI64(this.arg5);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testMulti_result = function(args) {
      this.success = null;
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = new ThriftTest.Xtruct(args.success);
        }
      }
    };
ThriftTest.ThriftTest_testMulti_result.prototype = {};
    ThriftTest.ThriftTest_testMulti_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.STRUCT) {
            this.success = new ThriftTest.Xtruct();
            this.success.read(input);
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testMulti_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testMulti_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.STRUCT, 0);
        this.success.write(output);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testException_args = function(args) {
      this.arg = null;
      if (args) {
        if (args.arg !== undefined && args.arg !== null) {
          this.arg = args.arg;
        }
      }
    };
ThriftTest.ThriftTest_testException_args.prototype = {};
    ThriftTest.ThriftTest_testException_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.STRING) {
            this.arg = input.readString().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testException_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testException_args');
      if (this.arg !== null && this.arg !== undefined) {
        output.writeFieldBegin('arg', Thrift.Type.STRING, 1);
        output.writeString(this.arg);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testException_result = function(args) {
      this.err1 = null;
      if (args instanceof ThriftTest.Xception) {
            this.err1 = args;
            return;
      }
      if (args) {
        if (args.err1 !== undefined && args.err1 !== null) {
          this.err1 = args.err1;
        }
      }
    };
ThriftTest.ThriftTest_testException_result.prototype = {};
    ThriftTest.ThriftTest_testException_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.STRUCT) {
            this.err1 = new ThriftTest.Xception();
            this.err1.read(input);
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testException_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testException_result');
      if (this.err1 !== null && this.err1 !== undefined) {
        output.writeFieldBegin('err1', Thrift.Type.STRUCT, 1);
        this.err1.write(output);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testMultiException_args = function(args) {
      this.arg0 = null;
      this.arg1 = null;
      if (args) {
        if (args.arg0 !== undefined && args.arg0 !== null) {
          this.arg0 = args.arg0;
        }
        if (args.arg1 !== undefined && args.arg1 !== null) {
          this.arg1 = args.arg1;
        }
      }
    };
ThriftTest.ThriftTest_testMultiException_args.prototype = {};
    ThriftTest.ThriftTest_testMultiException_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.STRING) {
            this.arg0 = input.readString().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 2:
          if (ftype == Thrift.Type.STRING) {
            this.arg1 = input.readString().value;
          } else {
            input.skip(ftype);
          }
          break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testMultiException_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testMultiException_args');
      if (this.arg0 !== null && this.arg0 !== undefined) {
        output.writeFieldBegin('arg0', Thrift.Type.STRING, 1);
        output.writeString(this.arg0);
        output.writeFieldEnd();
      }
      if (this.arg1 !== null && this.arg1 !== undefined) {
        output.writeFieldBegin('arg1', Thrift.Type.STRING, 2);
        output.writeString(this.arg1);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testMultiException_result = function(args) {
      this.success = null;
      this.err1 = null;
      this.err2 = null;
      if (args instanceof ThriftTest.Xception) {
            this.err1 = args;
            return;
      }
      if (args instanceof ThriftTest.Xception2) {
            this.err2 = args;
            return;
      }
      if (args) {
        if (args.success !== undefined && args.success !== null) {
          this.success = new ThriftTest.Xtruct(args.success);
        }
        if (args.err1 !== undefined && args.err1 !== null) {
          this.err1 = args.err1;
        }
        if (args.err2 !== undefined && args.err2 !== null) {
          this.err2 = args.err2;
        }
      }
    };
ThriftTest.ThriftTest_testMultiException_result.prototype = {};
    ThriftTest.ThriftTest_testMultiException_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 0:
          if (ftype == Thrift.Type.STRUCT) {
            this.success = new ThriftTest.Xtruct();
            this.success.read(input);
          } else {
            input.skip(ftype);
          }
          break;
          case 1:
          if (ftype == Thrift.Type.STRUCT) {
            this.err1 = new ThriftTest.Xception();
            this.err1.read(input);
          } else {
            input.skip(ftype);
          }
          break;
          case 2:
          if (ftype == Thrift.Type.STRUCT) {
            this.err2 = new ThriftTest.Xception2();
            this.err2.read(input);
          } else {
            input.skip(ftype);
          }
          break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testMultiException_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testMultiException_result');
      if (this.success !== null && this.success !== undefined) {
        output.writeFieldBegin('success', Thrift.Type.STRUCT, 0);
        this.success.write(output);
        output.writeFieldEnd();
      }
      if (this.err1 !== null && this.err1 !== undefined) {
        output.writeFieldBegin('err1', Thrift.Type.STRUCT, 1);
        this.err1.write(output);
        output.writeFieldEnd();
      }
      if (this.err2 !== null && this.err2 !== undefined) {
        output.writeFieldBegin('err2', Thrift.Type.STRUCT, 2);
        this.err2.write(output);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testOneway_args = function(args) {
      this.secondsToSleep = null;
      if (args) {
        if (args.secondsToSleep !== undefined && args.secondsToSleep !== null) {
          this.secondsToSleep = args.secondsToSleep;
        }
      }
    };
ThriftTest.ThriftTest_testOneway_args.prototype = {};
    ThriftTest.ThriftTest_testOneway_args.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        var fid = ret.fid;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        switch (fid) {
          case 1:
          if (ftype == Thrift.Type.I32) {
            this.secondsToSleep = input.readI32().value;
          } else {
            input.skip(ftype);
          }
          break;
          case 0:
            input.skip(ftype);
            break;
          default:
            input.skip(ftype);
        }
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testOneway_args.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testOneway_args');
      if (this.secondsToSleep !== null && this.secondsToSleep !== undefined) {
        output.writeFieldBegin('secondsToSleep', Thrift.Type.I32, 1);
        output.writeI32(this.secondsToSleep);
        output.writeFieldEnd();
      }
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTest_testOneway_result = function(args) {
    };
ThriftTest.ThriftTest_testOneway_result.prototype = {};
    ThriftTest.ThriftTest_testOneway_result.prototype.read = function(input) {
      input.readStructBegin();
      while (true) {
        var ret = input.readFieldBegin();
        var ftype = ret.ftype;
        if (ftype == Thrift.Type.STOP) {
          break;
        }
        input.skip(ftype);
        input.readFieldEnd();
      }
      input.readStructEnd();
      return;
    };

    ThriftTest.ThriftTest_testOneway_result.prototype.write = function(output) {
      output.writeStructBegin('ThriftTest_testOneway_result');
      output.writeFieldStop();
      output.writeStructEnd();
      return;
    };

ThriftTest.ThriftTestClient = function(input, output) {
      this.input = input;
      this.output = (!output) ? input : output;
      this.seqid = 0;
    };
    ThriftTest.ThriftTestClient.prototype = {};

    ThriftTest.ThriftTestClient.prototype.testVoid = function(callback) {
      this.send_testVoid(callback); 
      if (!callback) {
      this.recv_testVoid();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testVoid = function(callback) {
      var args = new ThriftTest.ThriftTest_testVoid_args();
      try {
        this.output.writeMessageBegin('testVoid', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testVoid();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testVoid = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testVoid_result();
      result.read(this.input);
      this.input.readMessageEnd();

      return;
    };

    ThriftTest.ThriftTestClient.prototype.testString = function(thing, callback) {
      this.send_testString(thing, callback); 
      if (!callback) {
        return this.recv_testString();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testString = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testString_args(params);
      try {
        this.output.writeMessageBegin('testString', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testString();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testString = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testString_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testString failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testBool = function(thing, callback) {
      this.send_testBool(thing, callback); 
      if (!callback) {
        return this.recv_testBool();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testBool = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testBool_args(params);
      try {
        this.output.writeMessageBegin('testBool', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testBool();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testBool = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testBool_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testBool failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testByte = function(thing, callback) {
      this.send_testByte(thing, callback); 
      if (!callback) {
        return this.recv_testByte();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testByte = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testByte_args(params);
      try {
        this.output.writeMessageBegin('testByte', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testByte();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testByte = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testByte_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testByte failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testI32 = function(thing, callback) {
      this.send_testI32(thing, callback); 
      if (!callback) {
        return this.recv_testI32();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testI32 = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testI32_args(params);
      try {
        this.output.writeMessageBegin('testI32', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testI32();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testI32 = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testI32_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testI32 failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testI64 = function(thing, callback) {
      this.send_testI64(thing, callback); 
      if (!callback) {
        return this.recv_testI64();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testI64 = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testI64_args(params);
      try {
        this.output.writeMessageBegin('testI64', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testI64();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testI64 = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testI64_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testI64 failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testDouble = function(thing, callback) {
      this.send_testDouble(thing, callback); 
      if (!callback) {
        return this.recv_testDouble();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testDouble = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testDouble_args(params);
      try {
        this.output.writeMessageBegin('testDouble', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testDouble();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testDouble = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testDouble_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testDouble failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testBinary = function(thing, callback) {
      this.send_testBinary(thing, callback); 
      if (!callback) {
        return this.recv_testBinary();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testBinary = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testBinary_args(params);
      try {
        this.output.writeMessageBegin('testBinary', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testBinary();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testBinary = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testBinary_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testBinary failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testStruct = function(thing, callback) {
      this.send_testStruct(thing, callback); 
      if (!callback) {
        return this.recv_testStruct();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testStruct = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testStruct_args(params);
      try {
        this.output.writeMessageBegin('testStruct', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testStruct();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testStruct = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testStruct_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testStruct failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testNest = function(thing, callback) {
      this.send_testNest(thing, callback); 
      if (!callback) {
        return this.recv_testNest();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testNest = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testNest_args(params);
      try {
        this.output.writeMessageBegin('testNest', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testNest();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testNest = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testNest_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testNest failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testMap = function(thing, callback) {
      this.send_testMap(thing, callback); 
      if (!callback) {
        return this.recv_testMap();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testMap = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testMap_args(params);
      try {
        this.output.writeMessageBegin('testMap', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testMap();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testMap = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testMap_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testMap failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testStringMap = function(thing, callback) {
      this.send_testStringMap(thing, callback); 
      if (!callback) {
        return this.recv_testStringMap();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testStringMap = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testStringMap_args(params);
      try {
        this.output.writeMessageBegin('testStringMap', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testStringMap();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testStringMap = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testStringMap_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testStringMap failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testSet = function(thing, callback) {
      this.send_testSet(thing, callback); 
      if (!callback) {
        return this.recv_testSet();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testSet = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testSet_args(params);
      try {
        this.output.writeMessageBegin('testSet', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testSet();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testSet = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testSet_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testSet failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testList = function(thing, callback) {
      this.send_testList(thing, callback); 
      if (!callback) {
        return this.recv_testList();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testList = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testList_args(params);
      try {
        this.output.writeMessageBegin('testList', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testList();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testList = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testList_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testList failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testEnum = function(thing, callback) {
      this.send_testEnum(thing, callback); 
      if (!callback) {
        return this.recv_testEnum();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testEnum = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testEnum_args(params);
      try {
        this.output.writeMessageBegin('testEnum', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testEnum();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testEnum = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testEnum_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testEnum failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testTypedef = function(thing, callback) {
      this.send_testTypedef(thing, callback); 
      if (!callback) {
        return this.recv_testTypedef();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testTypedef = function(thing, callback) {
      var params = {
        thing: thing
      };
      var args = new ThriftTest.ThriftTest_testTypedef_args(params);
      try {
        this.output.writeMessageBegin('testTypedef', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testTypedef();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testTypedef = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testTypedef_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testTypedef failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testMapMap = function(hello, callback) {
      this.send_testMapMap(hello, callback); 
      if (!callback) {
        return this.recv_testMapMap();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testMapMap = function(hello, callback) {
      var params = {
        hello: hello
      };
      var args = new ThriftTest.ThriftTest_testMapMap_args(params);
      try {
        this.output.writeMessageBegin('testMapMap', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testMapMap();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testMapMap = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testMapMap_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testMapMap failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testInsanity = function(argument, callback) {
      this.send_testInsanity(argument, callback); 
      if (!callback) {
        return this.recv_testInsanity();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testInsanity = function(argument, callback) {
      var params = {
        argument: argument
      };
      var args = new ThriftTest.ThriftTest_testInsanity_args(params);
      try {
        this.output.writeMessageBegin('testInsanity', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testInsanity();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testInsanity = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testInsanity_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testInsanity failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testMulti = function(arg0, arg1, arg2, arg3, arg4, arg5, callback) {
      this.send_testMulti(arg0, arg1, arg2, arg3, arg4, arg5, callback); 
      if (!callback) {
        return this.recv_testMulti();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testMulti = function(arg0, arg1, arg2, arg3, arg4, arg5, callback) {
      var params = {
        arg0: arg0,
        arg1: arg1,
        arg2: arg2,
        arg3: arg3,
        arg4: arg4,
        arg5: arg5
      };
      var args = new ThriftTest.ThriftTest_testMulti_args(params);
      try {
        this.output.writeMessageBegin('testMulti', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testMulti();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testMulti = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testMulti_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.success) {
        return result.success;
      }
      throw 'testMulti failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testException = function(arg, callback) {
      this.send_testException(arg, callback); 
      if (!callback) {
      this.recv_testException();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testException = function(arg, callback) {
      var params = {
        arg: arg
      };
      var args = new ThriftTest.ThriftTest_testException_args(params);
      try {
        this.output.writeMessageBegin('testException', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testException();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testException = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testException_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.err1) {
        throw result.err1;
      }
      return;
    };

    ThriftTest.ThriftTestClient.prototype.testMultiException = function(arg0, arg1, callback) {
      this.send_testMultiException(arg0, arg1, callback); 
      if (!callback) {
        return this.recv_testMultiException();
      }
    };

    ThriftTest.ThriftTestClient.prototype.send_testMultiException = function(arg0, arg1, callback) {
      var params = {
        arg0: arg0,
        arg1: arg1
      };
      var args = new ThriftTest.ThriftTest_testMultiException_args(params);
      try {
        this.output.writeMessageBegin('testMultiException', Thrift.MessageType.CALL, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          var self = this;
          this.output.getTransport().flush(true, function() {
            var result = null;
            try {
              result = self.recv_testMultiException();
            } catch (e) {
              result = e;
            }
            callback(result);
          });
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

    ThriftTest.ThriftTestClient.prototype.recv_testMultiException = function() {
      var ret = this.input.readMessageBegin();
      var mtype = ret.mtype;
      if (mtype == Thrift.MessageType.EXCEPTION) {
        var x = new Thrift.TApplicationException();
        x.read(this.input);
        this.input.readMessageEnd();
        throw x;
      }
      var result = new ThriftTest.ThriftTest_testMultiException_result();
      result.read(this.input);
      this.input.readMessageEnd();

      if (null !== result.err1) {
        throw result.err1;
      }
      if (null !== result.err2) {
        throw result.err2;
      }
      if (null !== result.success) {
        return result.success;
      }
      throw 'testMultiException failed: unknown result';
    };

    ThriftTest.ThriftTestClient.prototype.testOneway = function(secondsToSleep, callback) {
      this.send_testOneway(secondsToSleep, callback); 
    };

    ThriftTest.ThriftTestClient.prototype.send_testOneway = function(secondsToSleep, callback) {
      var params = {
        secondsToSleep: secondsToSleep
      };
      var args = new ThriftTest.ThriftTest_testOneway_args(params);
      try {
        this.output.writeMessageBegin('testOneway', Thrift.MessageType.ONEWAY, this.seqid);
        args.write(this.output);
        this.output.writeMessageEnd();
        if (callback) {
          this.output.getTransport().flush(true, null);
          callback();
        } else {
          return this.output.getTransport().flush();
        }
      }
      catch (e) {
        if (typeof this.output.getTransport().reset === 'function') {
          this.output.getTransport().reset();
        }
        throw e;
      }
    };

},{"node-int64":8}],10:[function(require,module,exports){
//
// Autogenerated by Thrift Compiler (1.0.0-dev)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//
if (typeof Int64 === 'undefined') {var Int64 = require('node-int64');}


if (typeof ThriftTest === 'undefined') {
  ThriftTest = {};
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports.ThriftTest = ThriftTest;
}
ThriftTest.Numberz = {
  '1' : 'ONE',
  'ONE' : 1,
  '2' : 'TWO',
  'TWO' : 2,
  '3' : 'THREE',
  'THREE' : 3,
  '5' : 'FIVE',
  'FIVE' : 5,
  '6' : 'SIX',
  'SIX' : 6,
  '8' : 'EIGHT',
  'EIGHT' : 8
};
ThriftTest.Bonk = function(args) {
  this.message = null;
  this.type = null;
  if (args) {
    if (args.message !== undefined && args.message !== null) {
      this.message = args.message;
    }
    if (args.type !== undefined && args.type !== null) {
      this.type = args.type;
    }
  }
};
ThriftTest.Bonk.prototype = {};
ThriftTest.Bonk.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.STRING) {
        this.message = input.readString().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.I32) {
        this.type = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.Bonk.prototype.write = function(output) {
  output.writeStructBegin('Bonk');
  if (this.message !== null && this.message !== undefined) {
    output.writeFieldBegin('message', Thrift.Type.STRING, 1);
    output.writeString(this.message);
    output.writeFieldEnd();
  }
  if (this.type !== null && this.type !== undefined) {
    output.writeFieldBegin('type', Thrift.Type.I32, 2);
    output.writeI32(this.type);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.Bools = function(args) {
  this.im_true = null;
  this.im_false = null;
  if (args) {
    if (args.im_true !== undefined && args.im_true !== null) {
      this.im_true = args.im_true;
    }
    if (args.im_false !== undefined && args.im_false !== null) {
      this.im_false = args.im_false;
    }
  }
};
ThriftTest.Bools.prototype = {};
ThriftTest.Bools.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.BOOL) {
        this.im_true = input.readBool().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.BOOL) {
        this.im_false = input.readBool().value;
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.Bools.prototype.write = function(output) {
  output.writeStructBegin('Bools');
  if (this.im_true !== null && this.im_true !== undefined) {
    output.writeFieldBegin('im_true', Thrift.Type.BOOL, 1);
    output.writeBool(this.im_true);
    output.writeFieldEnd();
  }
  if (this.im_false !== null && this.im_false !== undefined) {
    output.writeFieldBegin('im_false', Thrift.Type.BOOL, 2);
    output.writeBool(this.im_false);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.Xtruct = function(args) {
  this.string_thing = null;
  this.byte_thing = null;
  this.i32_thing = null;
  this.i64_thing = null;
  if (args) {
    if (args.string_thing !== undefined && args.string_thing !== null) {
      this.string_thing = args.string_thing;
    }
    if (args.byte_thing !== undefined && args.byte_thing !== null) {
      this.byte_thing = args.byte_thing;
    }
    if (args.i32_thing !== undefined && args.i32_thing !== null) {
      this.i32_thing = args.i32_thing;
    }
    if (args.i64_thing !== undefined && args.i64_thing !== null) {
      this.i64_thing = args.i64_thing;
    }
  }
};
ThriftTest.Xtruct.prototype = {};
ThriftTest.Xtruct.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.STRING) {
        this.string_thing = input.readString().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 4:
      if (ftype == Thrift.Type.BYTE) {
        this.byte_thing = input.readByte().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 9:
      if (ftype == Thrift.Type.I32) {
        this.i32_thing = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 11:
      if (ftype == Thrift.Type.I64) {
        this.i64_thing = input.readI64().value;
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.Xtruct.prototype.write = function(output) {
  output.writeStructBegin('Xtruct');
  if (this.string_thing !== null && this.string_thing !== undefined) {
    output.writeFieldBegin('string_thing', Thrift.Type.STRING, 1);
    output.writeString(this.string_thing);
    output.writeFieldEnd();
  }
  if (this.byte_thing !== null && this.byte_thing !== undefined) {
    output.writeFieldBegin('byte_thing', Thrift.Type.BYTE, 4);
    output.writeByte(this.byte_thing);
    output.writeFieldEnd();
  }
  if (this.i32_thing !== null && this.i32_thing !== undefined) {
    output.writeFieldBegin('i32_thing', Thrift.Type.I32, 9);
    output.writeI32(this.i32_thing);
    output.writeFieldEnd();
  }
  if (this.i64_thing !== null && this.i64_thing !== undefined) {
    output.writeFieldBegin('i64_thing', Thrift.Type.I64, 11);
    output.writeI64(this.i64_thing);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.Xtruct2 = function(args) {
  this.byte_thing = null;
  this.struct_thing = null;
  this.i32_thing = null;
  if (args) {
    if (args.byte_thing !== undefined && args.byte_thing !== null) {
      this.byte_thing = args.byte_thing;
    }
    if (args.struct_thing !== undefined && args.struct_thing !== null) {
      this.struct_thing = new ThriftTest.Xtruct(args.struct_thing);
    }
    if (args.i32_thing !== undefined && args.i32_thing !== null) {
      this.i32_thing = args.i32_thing;
    }
  }
};
ThriftTest.Xtruct2.prototype = {};
ThriftTest.Xtruct2.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.BYTE) {
        this.byte_thing = input.readByte().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.STRUCT) {
        this.struct_thing = new ThriftTest.Xtruct();
        this.struct_thing.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 3:
      if (ftype == Thrift.Type.I32) {
        this.i32_thing = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.Xtruct2.prototype.write = function(output) {
  output.writeStructBegin('Xtruct2');
  if (this.byte_thing !== null && this.byte_thing !== undefined) {
    output.writeFieldBegin('byte_thing', Thrift.Type.BYTE, 1);
    output.writeByte(this.byte_thing);
    output.writeFieldEnd();
  }
  if (this.struct_thing !== null && this.struct_thing !== undefined) {
    output.writeFieldBegin('struct_thing', Thrift.Type.STRUCT, 2);
    this.struct_thing.write(output);
    output.writeFieldEnd();
  }
  if (this.i32_thing !== null && this.i32_thing !== undefined) {
    output.writeFieldBegin('i32_thing', Thrift.Type.I32, 3);
    output.writeI32(this.i32_thing);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.Xtruct3 = function(args) {
  this.string_thing = null;
  this.changed = null;
  this.i32_thing = null;
  this.i64_thing = null;
  if (args) {
    if (args.string_thing !== undefined && args.string_thing !== null) {
      this.string_thing = args.string_thing;
    }
    if (args.changed !== undefined && args.changed !== null) {
      this.changed = args.changed;
    }
    if (args.i32_thing !== undefined && args.i32_thing !== null) {
      this.i32_thing = args.i32_thing;
    }
    if (args.i64_thing !== undefined && args.i64_thing !== null) {
      this.i64_thing = args.i64_thing;
    }
  }
};
ThriftTest.Xtruct3.prototype = {};
ThriftTest.Xtruct3.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.STRING) {
        this.string_thing = input.readString().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 4:
      if (ftype == Thrift.Type.I32) {
        this.changed = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 9:
      if (ftype == Thrift.Type.I32) {
        this.i32_thing = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 11:
      if (ftype == Thrift.Type.I64) {
        this.i64_thing = input.readI64().value;
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.Xtruct3.prototype.write = function(output) {
  output.writeStructBegin('Xtruct3');
  if (this.string_thing !== null && this.string_thing !== undefined) {
    output.writeFieldBegin('string_thing', Thrift.Type.STRING, 1);
    output.writeString(this.string_thing);
    output.writeFieldEnd();
  }
  if (this.changed !== null && this.changed !== undefined) {
    output.writeFieldBegin('changed', Thrift.Type.I32, 4);
    output.writeI32(this.changed);
    output.writeFieldEnd();
  }
  if (this.i32_thing !== null && this.i32_thing !== undefined) {
    output.writeFieldBegin('i32_thing', Thrift.Type.I32, 9);
    output.writeI32(this.i32_thing);
    output.writeFieldEnd();
  }
  if (this.i64_thing !== null && this.i64_thing !== undefined) {
    output.writeFieldBegin('i64_thing', Thrift.Type.I64, 11);
    output.writeI64(this.i64_thing);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.Insanity = function(args) {
  this.userMap = null;
  this.xtructs = null;
  if (args) {
    if (args.userMap !== undefined && args.userMap !== null) {
      this.userMap = Thrift.copyMap(args.userMap, [null]);
    }
    if (args.xtructs !== undefined && args.xtructs !== null) {
      this.xtructs = Thrift.copyList(args.xtructs, [ThriftTest.Xtruct]);
    }
  }
};
ThriftTest.Insanity.prototype = {};
ThriftTest.Insanity.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.MAP) {
        this.userMap = {};
        var _rtmp31 = input.readMapBegin();
        var _size0 = _rtmp31.size || 0;
        for (var _i2 = 0; _i2 < _size0; ++_i2) {
          if (_i2 > 0 ) {
            if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
              input.rstack.pop();
            }
          }
          var key3 = null;
          var val4 = null;
          key3 = input.readI32().value;
          val4 = input.readI64().value;
          this.userMap[key3] = val4;
        }
        input.readMapEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.LIST) {
        this.xtructs = [];
        var _rtmp36 = input.readListBegin();
        var _size5 = _rtmp36.size || 0;
        for (var _i7 = 0; _i7 < _size5; ++_i7) {
          var elem8 = null;
          elem8 = new ThriftTest.Xtruct();
          elem8.read(input);
          this.xtructs.push(elem8);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.Insanity.prototype.write = function(output) {
  output.writeStructBegin('Insanity');
  if (this.userMap !== null && this.userMap !== undefined) {
    output.writeFieldBegin('userMap', Thrift.Type.MAP, 1);
    output.writeMapBegin(Thrift.Type.I32, Thrift.Type.I64, Thrift.objectLength(this.userMap));
    for (var kiter9 in this.userMap) {
      if (this.userMap.hasOwnProperty(kiter9)) {
        var viter10 = this.userMap[kiter9];
        output.writeI32(kiter9);
        output.writeI64(viter10);
      }
    }
    output.writeMapEnd();
    output.writeFieldEnd();
  }
  if (this.xtructs !== null && this.xtructs !== undefined) {
    output.writeFieldBegin('xtructs', Thrift.Type.LIST, 2);
    output.writeListBegin(Thrift.Type.STRUCT, this.xtructs.length);
    for (var iter11 in this.xtructs) {
      if (this.xtructs.hasOwnProperty(iter11)) {
        iter11 = this.xtructs[iter11];
        iter11.write(output);
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.CrazyNesting = function(args) {
  this.string_field = null;
  this.set_field = null;
  this.list_field = null;
  this.binary_field = null;
  if (args) {
    if (args.string_field !== undefined && args.string_field !== null) {
      this.string_field = args.string_field;
    }
    if (args.set_field !== undefined && args.set_field !== null) {
      this.set_field = Thrift.copyList(args.set_field, [ThriftTest.Insanity]);
    }
    if (args.list_field !== undefined && args.list_field !== null) {
      this.list_field = Thrift.copyList(args.list_field, [Thrift.copyMap, Thrift.copyMap, Thrift.copyList, Thrift.copyList, Thrift.copyMap, null]);
    } else {
      throw new Thrift.TProtocolException(Thrift.TProtocolExceptionType.UNKNOWN, 'Required field list_field is unset!');
    }
    if (args.binary_field !== undefined && args.binary_field !== null) {
      this.binary_field = args.binary_field;
    }
  }
};
ThriftTest.CrazyNesting.prototype = {};
ThriftTest.CrazyNesting.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.STRING) {
        this.string_field = input.readString().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.SET) {
        this.set_field = [];
        var _rtmp313 = input.readSetBegin();
        var _size12 = _rtmp313.size || 0;
        for (var _i14 = 0; _i14 < _size12; ++_i14) {
          var elem15 = null;
          elem15 = new ThriftTest.Insanity();
          elem15.read(input);
          this.set_field.push(elem15);
        }
        input.readSetEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 3:
      if (ftype == Thrift.Type.LIST) {
        this.list_field = [];
        var _rtmp317 = input.readListBegin();
        var _size16 = _rtmp317.size || 0;
        for (var _i18 = 0; _i18 < _size16; ++_i18) {
          var elem19 = null;
          elem19 = {};
          var _rtmp321 = input.readMapBegin();
          var _size20 = _rtmp321.size || 0;
          for (var _i22 = 0; _i22 < _size20; ++_i22) {
            if (_i22 > 0 ) {
              if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                input.rstack.pop();
              }
            }
            var key23 = null;
            var val24 = null;
            key23 = [];
            var _rtmp326 = input.readSetBegin();
            var _size25 = _rtmp326.size || 0;
            for (var _i27 = 0; _i27 < _size25; ++_i27) {
              var elem28 = null;
              elem28 = input.readI32().value;
              key23.push(elem28);
            }
            input.readSetEnd();
            val24 = {};
            var _rtmp330 = input.readMapBegin();
            var _size29 = _rtmp330.size || 0;
            for (var _i31 = 0; _i31 < _size29; ++_i31) {
              if (_i31 > 0 ) {
                if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                  input.rstack.pop();
                }
              }
              var key32 = null;
              var val33 = null;
              key32 = input.readI32().value;
              val33 = [];
              var _rtmp335 = input.readSetBegin();
              var _size34 = _rtmp335.size || 0;
              for (var _i36 = 0; _i36 < _size34; ++_i36) {
                var elem37 = null;
                elem37 = [];
                var _rtmp339 = input.readListBegin();
                var _size38 = _rtmp339.size || 0;
                for (var _i40 = 0; _i40 < _size38; ++_i40) {
                  var elem41 = null;
                  elem41 = {};
                  var _rtmp343 = input.readMapBegin();
                  var _size42 = _rtmp343.size || 0;
                  for (var _i44 = 0; _i44 < _size42; ++_i44) {
                    if (_i44 > 0 ) {
                      if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                        input.rstack.pop();
                      }
                    }
                    var key45 = null;
                    var val46 = null;
                    key45 = new ThriftTest.Insanity();
                    key45.read(input);
                    val46 = input.readString().value;
                    elem41[key45] = val46;
                  }
                  input.readMapEnd();
                  elem37.push(elem41);
                }
                input.readListEnd();
                val33.push(elem37);
              }
              input.readSetEnd();
              val24[key32] = val33;
            }
            input.readMapEnd();
            elem19[key23] = val24;
          }
          input.readMapEnd();
          this.list_field.push(elem19);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 4:
      if (ftype == Thrift.Type.STRING) {
        this.binary_field = input.readBinary().value;
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.CrazyNesting.prototype.write = function(output) {
  output.writeStructBegin('CrazyNesting');
  if (this.string_field !== null && this.string_field !== undefined) {
    output.writeFieldBegin('string_field', Thrift.Type.STRING, 1);
    output.writeString(this.string_field);
    output.writeFieldEnd();
  }
  if (this.set_field !== null && this.set_field !== undefined) {
    output.writeFieldBegin('set_field', Thrift.Type.SET, 2);
    output.writeSetBegin(Thrift.Type.STRUCT, this.set_field.length);
    for (var iter47 in this.set_field) {
      if (this.set_field.hasOwnProperty(iter47)) {
        iter47 = this.set_field[iter47];
        iter47.write(output);
      }
    }
    output.writeSetEnd();
    output.writeFieldEnd();
  }
  if (this.list_field !== null && this.list_field !== undefined) {
    output.writeFieldBegin('list_field', Thrift.Type.LIST, 3);
    output.writeListBegin(Thrift.Type.MAP, this.list_field.length);
    for (var iter48 in this.list_field) {
      if (this.list_field.hasOwnProperty(iter48)) {
        iter48 = this.list_field[iter48];
        output.writeMapBegin(Thrift.Type.SET, Thrift.Type.MAP, Thrift.objectLength(iter48));
        for (var kiter49 in iter48) {
          if (iter48.hasOwnProperty(kiter49)) {
            var viter50 = iter48[kiter49];
            output.writeSetBegin(Thrift.Type.I32, kiter49.length);
            for (var iter51 in kiter49) {
              if (kiter49.hasOwnProperty(iter51)) {
                iter51 = kiter49[iter51];
                output.writeI32(iter51);
              }
            }
            output.writeSetEnd();
            output.writeMapBegin(Thrift.Type.I32, Thrift.Type.SET, Thrift.objectLength(viter50));
            for (var kiter52 in viter50) {
              if (viter50.hasOwnProperty(kiter52)) {
                var viter53 = viter50[kiter52];
                output.writeI32(kiter52);
                output.writeSetBegin(Thrift.Type.LIST, viter53.length);
                for (var iter54 in viter53) {
                  if (viter53.hasOwnProperty(iter54)) {
                    iter54 = viter53[iter54];
                    output.writeListBegin(Thrift.Type.MAP, iter54.length);
                    for (var iter55 in iter54) {
                      if (iter54.hasOwnProperty(iter55)) {
                        iter55 = iter54[iter55];
                        output.writeMapBegin(Thrift.Type.STRUCT, Thrift.Type.STRING, Thrift.objectLength(iter55));
                        for (var kiter56 in iter55) {
                          if (iter55.hasOwnProperty(kiter56)) {
                            var viter57 = iter55[kiter56];
                            kiter56.write(output);
                            output.writeString(viter57);
                          }
                        }
                        output.writeMapEnd();
                      }
                    }
                    output.writeListEnd();
                  }
                }
                output.writeSetEnd();
              }
            }
            output.writeMapEnd();
          }
        }
        output.writeMapEnd();
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  if (this.binary_field !== null && this.binary_field !== undefined) {
    output.writeFieldBegin('binary_field', Thrift.Type.STRING, 4);
    output.writeBinary(this.binary_field);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.SomeUnion = function(args) {
  this.map_thing = null;
  this.string_thing = null;
  this.i32_thing = null;
  this.xtruct_thing = null;
  this.insanity_thing = null;
  if (args) {
    if (args.map_thing !== undefined && args.map_thing !== null) {
      this.map_thing = Thrift.copyMap(args.map_thing, [null]);
    }
    if (args.string_thing !== undefined && args.string_thing !== null) {
      this.string_thing = args.string_thing;
    }
    if (args.i32_thing !== undefined && args.i32_thing !== null) {
      this.i32_thing = args.i32_thing;
    }
    if (args.xtruct_thing !== undefined && args.xtruct_thing !== null) {
      this.xtruct_thing = new ThriftTest.Xtruct3(args.xtruct_thing);
    }
    if (args.insanity_thing !== undefined && args.insanity_thing !== null) {
      this.insanity_thing = new ThriftTest.Insanity(args.insanity_thing);
    }
  }
};
ThriftTest.SomeUnion.prototype = {};
ThriftTest.SomeUnion.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.MAP) {
        this.map_thing = {};
        var _rtmp359 = input.readMapBegin();
        var _size58 = _rtmp359.size || 0;
        for (var _i60 = 0; _i60 < _size58; ++_i60) {
          if (_i60 > 0 ) {
            if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
              input.rstack.pop();
            }
          }
          var key61 = null;
          var val62 = null;
          key61 = input.readI32().value;
          val62 = input.readI64().value;
          this.map_thing[key61] = val62;
        }
        input.readMapEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.STRING) {
        this.string_thing = input.readString().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 3:
      if (ftype == Thrift.Type.I32) {
        this.i32_thing = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 4:
      if (ftype == Thrift.Type.STRUCT) {
        this.xtruct_thing = new ThriftTest.Xtruct3();
        this.xtruct_thing.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 5:
      if (ftype == Thrift.Type.STRUCT) {
        this.insanity_thing = new ThriftTest.Insanity();
        this.insanity_thing.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.SomeUnion.prototype.write = function(output) {
  output.writeStructBegin('SomeUnion');
  if (this.map_thing !== null && this.map_thing !== undefined) {
    output.writeFieldBegin('map_thing', Thrift.Type.MAP, 1);
    output.writeMapBegin(Thrift.Type.I32, Thrift.Type.I64, Thrift.objectLength(this.map_thing));
    for (var kiter63 in this.map_thing) {
      if (this.map_thing.hasOwnProperty(kiter63)) {
        var viter64 = this.map_thing[kiter63];
        output.writeI32(kiter63);
        output.writeI64(viter64);
      }
    }
    output.writeMapEnd();
    output.writeFieldEnd();
  }
  if (this.string_thing !== null && this.string_thing !== undefined) {
    output.writeFieldBegin('string_thing', Thrift.Type.STRING, 2);
    output.writeString(this.string_thing);
    output.writeFieldEnd();
  }
  if (this.i32_thing !== null && this.i32_thing !== undefined) {
    output.writeFieldBegin('i32_thing', Thrift.Type.I32, 3);
    output.writeI32(this.i32_thing);
    output.writeFieldEnd();
  }
  if (this.xtruct_thing !== null && this.xtruct_thing !== undefined) {
    output.writeFieldBegin('xtruct_thing', Thrift.Type.STRUCT, 4);
    this.xtruct_thing.write(output);
    output.writeFieldEnd();
  }
  if (this.insanity_thing !== null && this.insanity_thing !== undefined) {
    output.writeFieldBegin('insanity_thing', Thrift.Type.STRUCT, 5);
    this.insanity_thing.write(output);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.Xception = function(args) {
  this.errorCode = null;
  this.message = null;
  if (args) {
    if (args.errorCode !== undefined && args.errorCode !== null) {
      this.errorCode = args.errorCode;
    }
    if (args.message !== undefined && args.message !== null) {
      this.message = args.message;
    }
  }
};
Thrift.inherits(ThriftTest.Xception, Thrift.TException);
ThriftTest.Xception.prototype.name = 'Xception';
ThriftTest.Xception.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.I32) {
        this.errorCode = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.STRING) {
        this.message = input.readString().value;
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.Xception.prototype.write = function(output) {
  output.writeStructBegin('Xception');
  if (this.errorCode !== null && this.errorCode !== undefined) {
    output.writeFieldBegin('errorCode', Thrift.Type.I32, 1);
    output.writeI32(this.errorCode);
    output.writeFieldEnd();
  }
  if (this.message !== null && this.message !== undefined) {
    output.writeFieldBegin('message', Thrift.Type.STRING, 2);
    output.writeString(this.message);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.Xception2 = function(args) {
  this.errorCode = null;
  this.struct_thing = null;
  if (args) {
    if (args.errorCode !== undefined && args.errorCode !== null) {
      this.errorCode = args.errorCode;
    }
    if (args.struct_thing !== undefined && args.struct_thing !== null) {
      this.struct_thing = new ThriftTest.Xtruct(args.struct_thing);
    }
  }
};
Thrift.inherits(ThriftTest.Xception2, Thrift.TException);
ThriftTest.Xception2.prototype.name = 'Xception2';
ThriftTest.Xception2.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.I32) {
        this.errorCode = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.STRUCT) {
        this.struct_thing = new ThriftTest.Xtruct();
        this.struct_thing.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.Xception2.prototype.write = function(output) {
  output.writeStructBegin('Xception2');
  if (this.errorCode !== null && this.errorCode !== undefined) {
    output.writeFieldBegin('errorCode', Thrift.Type.I32, 1);
    output.writeI32(this.errorCode);
    output.writeFieldEnd();
  }
  if (this.struct_thing !== null && this.struct_thing !== undefined) {
    output.writeFieldBegin('struct_thing', Thrift.Type.STRUCT, 2);
    this.struct_thing.write(output);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.EmptyStruct = function(args) {
};
ThriftTest.EmptyStruct.prototype = {};
ThriftTest.EmptyStruct.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    input.skip(ftype);
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.EmptyStruct.prototype.write = function(output) {
  output.writeStructBegin('EmptyStruct');
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.OneField = function(args) {
  this.field = null;
  if (args) {
    if (args.field !== undefined && args.field !== null) {
      this.field = new ThriftTest.EmptyStruct(args.field);
    }
  }
};
ThriftTest.OneField.prototype = {};
ThriftTest.OneField.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.STRUCT) {
        this.field = new ThriftTest.EmptyStruct();
        this.field.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 0:
        input.skip(ftype);
        break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.OneField.prototype.write = function(output) {
  output.writeStructBegin('OneField');
  if (this.field !== null && this.field !== undefined) {
    output.writeFieldBegin('field', Thrift.Type.STRUCT, 1);
    this.field.write(output);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.VersioningTestV1 = function(args) {
  this.begin_in_both = null;
  this.old_string = null;
  this.end_in_both = null;
  if (args) {
    if (args.begin_in_both !== undefined && args.begin_in_both !== null) {
      this.begin_in_both = args.begin_in_both;
    }
    if (args.old_string !== undefined && args.old_string !== null) {
      this.old_string = args.old_string;
    }
    if (args.end_in_both !== undefined && args.end_in_both !== null) {
      this.end_in_both = args.end_in_both;
    }
  }
};
ThriftTest.VersioningTestV1.prototype = {};
ThriftTest.VersioningTestV1.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.I32) {
        this.begin_in_both = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 3:
      if (ftype == Thrift.Type.STRING) {
        this.old_string = input.readString().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 12:
      if (ftype == Thrift.Type.I32) {
        this.end_in_both = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.VersioningTestV1.prototype.write = function(output) {
  output.writeStructBegin('VersioningTestV1');
  if (this.begin_in_both !== null && this.begin_in_both !== undefined) {
    output.writeFieldBegin('begin_in_both', Thrift.Type.I32, 1);
    output.writeI32(this.begin_in_both);
    output.writeFieldEnd();
  }
  if (this.old_string !== null && this.old_string !== undefined) {
    output.writeFieldBegin('old_string', Thrift.Type.STRING, 3);
    output.writeString(this.old_string);
    output.writeFieldEnd();
  }
  if (this.end_in_both !== null && this.end_in_both !== undefined) {
    output.writeFieldBegin('end_in_both', Thrift.Type.I32, 12);
    output.writeI32(this.end_in_both);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.VersioningTestV2 = function(args) {
  this.begin_in_both = null;
  this.newint = null;
  this.newbyte = null;
  this.newshort = null;
  this.newlong = null;
  this.newdouble = null;
  this.newstruct = null;
  this.newlist = null;
  this.newset = null;
  this.newmap = null;
  this.newstring = null;
  this.end_in_both = null;
  if (args) {
    if (args.begin_in_both !== undefined && args.begin_in_both !== null) {
      this.begin_in_both = args.begin_in_both;
    }
    if (args.newint !== undefined && args.newint !== null) {
      this.newint = args.newint;
    }
    if (args.newbyte !== undefined && args.newbyte !== null) {
      this.newbyte = args.newbyte;
    }
    if (args.newshort !== undefined && args.newshort !== null) {
      this.newshort = args.newshort;
    }
    if (args.newlong !== undefined && args.newlong !== null) {
      this.newlong = args.newlong;
    }
    if (args.newdouble !== undefined && args.newdouble !== null) {
      this.newdouble = args.newdouble;
    }
    if (args.newstruct !== undefined && args.newstruct !== null) {
      this.newstruct = new ThriftTest.Bonk(args.newstruct);
    }
    if (args.newlist !== undefined && args.newlist !== null) {
      this.newlist = Thrift.copyList(args.newlist, [null]);
    }
    if (args.newset !== undefined && args.newset !== null) {
      this.newset = Thrift.copyList(args.newset, [null]);
    }
    if (args.newmap !== undefined && args.newmap !== null) {
      this.newmap = Thrift.copyMap(args.newmap, [null]);
    }
    if (args.newstring !== undefined && args.newstring !== null) {
      this.newstring = args.newstring;
    }
    if (args.end_in_both !== undefined && args.end_in_both !== null) {
      this.end_in_both = args.end_in_both;
    }
  }
};
ThriftTest.VersioningTestV2.prototype = {};
ThriftTest.VersioningTestV2.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.I32) {
        this.begin_in_both = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.I32) {
        this.newint = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 3:
      if (ftype == Thrift.Type.BYTE) {
        this.newbyte = input.readByte().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 4:
      if (ftype == Thrift.Type.I16) {
        this.newshort = input.readI16().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 5:
      if (ftype == Thrift.Type.I64) {
        this.newlong = input.readI64().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 6:
      if (ftype == Thrift.Type.DOUBLE) {
        this.newdouble = input.readDouble().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 7:
      if (ftype == Thrift.Type.STRUCT) {
        this.newstruct = new ThriftTest.Bonk();
        this.newstruct.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 8:
      if (ftype == Thrift.Type.LIST) {
        this.newlist = [];
        var _rtmp366 = input.readListBegin();
        var _size65 = _rtmp366.size || 0;
        for (var _i67 = 0; _i67 < _size65; ++_i67) {
          var elem68 = null;
          elem68 = input.readI32().value;
          this.newlist.push(elem68);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 9:
      if (ftype == Thrift.Type.SET) {
        this.newset = [];
        var _rtmp370 = input.readSetBegin();
        var _size69 = _rtmp370.size || 0;
        for (var _i71 = 0; _i71 < _size69; ++_i71) {
          var elem72 = null;
          elem72 = input.readI32().value;
          this.newset.push(elem72);
        }
        input.readSetEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 10:
      if (ftype == Thrift.Type.MAP) {
        this.newmap = {};
        var _rtmp374 = input.readMapBegin();
        var _size73 = _rtmp374.size || 0;
        for (var _i75 = 0; _i75 < _size73; ++_i75) {
          if (_i75 > 0 ) {
            if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
              input.rstack.pop();
            }
          }
          var key76 = null;
          var val77 = null;
          key76 = input.readI32().value;
          val77 = input.readI32().value;
          this.newmap[key76] = val77;
        }
        input.readMapEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 11:
      if (ftype == Thrift.Type.STRING) {
        this.newstring = input.readString().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 12:
      if (ftype == Thrift.Type.I32) {
        this.end_in_both = input.readI32().value;
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.VersioningTestV2.prototype.write = function(output) {
  output.writeStructBegin('VersioningTestV2');
  if (this.begin_in_both !== null && this.begin_in_both !== undefined) {
    output.writeFieldBegin('begin_in_both', Thrift.Type.I32, 1);
    output.writeI32(this.begin_in_both);
    output.writeFieldEnd();
  }
  if (this.newint !== null && this.newint !== undefined) {
    output.writeFieldBegin('newint', Thrift.Type.I32, 2);
    output.writeI32(this.newint);
    output.writeFieldEnd();
  }
  if (this.newbyte !== null && this.newbyte !== undefined) {
    output.writeFieldBegin('newbyte', Thrift.Type.BYTE, 3);
    output.writeByte(this.newbyte);
    output.writeFieldEnd();
  }
  if (this.newshort !== null && this.newshort !== undefined) {
    output.writeFieldBegin('newshort', Thrift.Type.I16, 4);
    output.writeI16(this.newshort);
    output.writeFieldEnd();
  }
  if (this.newlong !== null && this.newlong !== undefined) {
    output.writeFieldBegin('newlong', Thrift.Type.I64, 5);
    output.writeI64(this.newlong);
    output.writeFieldEnd();
  }
  if (this.newdouble !== null && this.newdouble !== undefined) {
    output.writeFieldBegin('newdouble', Thrift.Type.DOUBLE, 6);
    output.writeDouble(this.newdouble);
    output.writeFieldEnd();
  }
  if (this.newstruct !== null && this.newstruct !== undefined) {
    output.writeFieldBegin('newstruct', Thrift.Type.STRUCT, 7);
    this.newstruct.write(output);
    output.writeFieldEnd();
  }
  if (this.newlist !== null && this.newlist !== undefined) {
    output.writeFieldBegin('newlist', Thrift.Type.LIST, 8);
    output.writeListBegin(Thrift.Type.I32, this.newlist.length);
    for (var iter78 in this.newlist) {
      if (this.newlist.hasOwnProperty(iter78)) {
        iter78 = this.newlist[iter78];
        output.writeI32(iter78);
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  if (this.newset !== null && this.newset !== undefined) {
    output.writeFieldBegin('newset', Thrift.Type.SET, 9);
    output.writeSetBegin(Thrift.Type.I32, this.newset.length);
    for (var iter79 in this.newset) {
      if (this.newset.hasOwnProperty(iter79)) {
        iter79 = this.newset[iter79];
        output.writeI32(iter79);
      }
    }
    output.writeSetEnd();
    output.writeFieldEnd();
  }
  if (this.newmap !== null && this.newmap !== undefined) {
    output.writeFieldBegin('newmap', Thrift.Type.MAP, 10);
    output.writeMapBegin(Thrift.Type.I32, Thrift.Type.I32, Thrift.objectLength(this.newmap));
    for (var kiter80 in this.newmap) {
      if (this.newmap.hasOwnProperty(kiter80)) {
        var viter81 = this.newmap[kiter80];
        output.writeI32(kiter80);
        output.writeI32(viter81);
      }
    }
    output.writeMapEnd();
    output.writeFieldEnd();
  }
  if (this.newstring !== null && this.newstring !== undefined) {
    output.writeFieldBegin('newstring', Thrift.Type.STRING, 11);
    output.writeString(this.newstring);
    output.writeFieldEnd();
  }
  if (this.end_in_both !== null && this.end_in_both !== undefined) {
    output.writeFieldBegin('end_in_both', Thrift.Type.I32, 12);
    output.writeI32(this.end_in_both);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.ListTypeVersioningV1 = function(args) {
  this.myints = null;
  this.hello = null;
  if (args) {
    if (args.myints !== undefined && args.myints !== null) {
      this.myints = Thrift.copyList(args.myints, [null]);
    }
    if (args.hello !== undefined && args.hello !== null) {
      this.hello = args.hello;
    }
  }
};
ThriftTest.ListTypeVersioningV1.prototype = {};
ThriftTest.ListTypeVersioningV1.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.LIST) {
        this.myints = [];
        var _rtmp383 = input.readListBegin();
        var _size82 = _rtmp383.size || 0;
        for (var _i84 = 0; _i84 < _size82; ++_i84) {
          var elem85 = null;
          elem85 = input.readI32().value;
          this.myints.push(elem85);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.STRING) {
        this.hello = input.readString().value;
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.ListTypeVersioningV1.prototype.write = function(output) {
  output.writeStructBegin('ListTypeVersioningV1');
  if (this.myints !== null && this.myints !== undefined) {
    output.writeFieldBegin('myints', Thrift.Type.LIST, 1);
    output.writeListBegin(Thrift.Type.I32, this.myints.length);
    for (var iter86 in this.myints) {
      if (this.myints.hasOwnProperty(iter86)) {
        iter86 = this.myints[iter86];
        output.writeI32(iter86);
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  if (this.hello !== null && this.hello !== undefined) {
    output.writeFieldBegin('hello', Thrift.Type.STRING, 2);
    output.writeString(this.hello);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.ListTypeVersioningV2 = function(args) {
  this.strings = null;
  this.hello = null;
  if (args) {
    if (args.strings !== undefined && args.strings !== null) {
      this.strings = Thrift.copyList(args.strings, [null]);
    }
    if (args.hello !== undefined && args.hello !== null) {
      this.hello = args.hello;
    }
  }
};
ThriftTest.ListTypeVersioningV2.prototype = {};
ThriftTest.ListTypeVersioningV2.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.LIST) {
        this.strings = [];
        var _rtmp388 = input.readListBegin();
        var _size87 = _rtmp388.size || 0;
        for (var _i89 = 0; _i89 < _size87; ++_i89) {
          var elem90 = null;
          elem90 = input.readString().value;
          this.strings.push(elem90);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.STRING) {
        this.hello = input.readString().value;
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.ListTypeVersioningV2.prototype.write = function(output) {
  output.writeStructBegin('ListTypeVersioningV2');
  if (this.strings !== null && this.strings !== undefined) {
    output.writeFieldBegin('strings', Thrift.Type.LIST, 1);
    output.writeListBegin(Thrift.Type.STRING, this.strings.length);
    for (var iter91 in this.strings) {
      if (this.strings.hasOwnProperty(iter91)) {
        iter91 = this.strings[iter91];
        output.writeString(iter91);
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  if (this.hello !== null && this.hello !== undefined) {
    output.writeFieldBegin('hello', Thrift.Type.STRING, 2);
    output.writeString(this.hello);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.GuessProtocolStruct = function(args) {
  this.map_field = null;
  if (args) {
    if (args.map_field !== undefined && args.map_field !== null) {
      this.map_field = Thrift.copyMap(args.map_field, [null]);
    }
  }
};
ThriftTest.GuessProtocolStruct.prototype = {};
ThriftTest.GuessProtocolStruct.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 7:
      if (ftype == Thrift.Type.MAP) {
        this.map_field = {};
        var _rtmp393 = input.readMapBegin();
        var _size92 = _rtmp393.size || 0;
        for (var _i94 = 0; _i94 < _size92; ++_i94) {
          if (_i94 > 0 ) {
            if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
              input.rstack.pop();
            }
          }
          var key95 = null;
          var val96 = null;
          key95 = input.readString().value;
          val96 = input.readString().value;
          this.map_field[key95] = val96;
        }
        input.readMapEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 0:
        input.skip(ftype);
        break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.GuessProtocolStruct.prototype.write = function(output) {
  output.writeStructBegin('GuessProtocolStruct');
  if (this.map_field !== null && this.map_field !== undefined) {
    output.writeFieldBegin('map_field', Thrift.Type.MAP, 7);
    output.writeMapBegin(Thrift.Type.STRING, Thrift.Type.STRING, Thrift.objectLength(this.map_field));
    for (var kiter97 in this.map_field) {
      if (this.map_field.hasOwnProperty(kiter97)) {
        var viter98 = this.map_field[kiter97];
        output.writeString(kiter97);
        output.writeString(viter98);
      }
    }
    output.writeMapEnd();
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.LargeDeltas = function(args) {
  this.b1 = null;
  this.b10 = null;
  this.b100 = null;
  this.check_true = null;
  this.b1000 = null;
  this.check_false = null;
  this.vertwo2000 = null;
  this.a_set2500 = null;
  this.vertwo3000 = null;
  this.big_numbers = null;
  if (args) {
    if (args.b1 !== undefined && args.b1 !== null) {
      this.b1 = new ThriftTest.Bools(args.b1);
    }
    if (args.b10 !== undefined && args.b10 !== null) {
      this.b10 = new ThriftTest.Bools(args.b10);
    }
    if (args.b100 !== undefined && args.b100 !== null) {
      this.b100 = new ThriftTest.Bools(args.b100);
    }
    if (args.check_true !== undefined && args.check_true !== null) {
      this.check_true = args.check_true;
    }
    if (args.b1000 !== undefined && args.b1000 !== null) {
      this.b1000 = new ThriftTest.Bools(args.b1000);
    }
    if (args.check_false !== undefined && args.check_false !== null) {
      this.check_false = args.check_false;
    }
    if (args.vertwo2000 !== undefined && args.vertwo2000 !== null) {
      this.vertwo2000 = new ThriftTest.VersioningTestV2(args.vertwo2000);
    }
    if (args.a_set2500 !== undefined && args.a_set2500 !== null) {
      this.a_set2500 = Thrift.copyList(args.a_set2500, [null]);
    }
    if (args.vertwo3000 !== undefined && args.vertwo3000 !== null) {
      this.vertwo3000 = new ThriftTest.VersioningTestV2(args.vertwo3000);
    }
    if (args.big_numbers !== undefined && args.big_numbers !== null) {
      this.big_numbers = Thrift.copyList(args.big_numbers, [null]);
    }
  }
};
ThriftTest.LargeDeltas.prototype = {};
ThriftTest.LargeDeltas.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.STRUCT) {
        this.b1 = new ThriftTest.Bools();
        this.b1.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 10:
      if (ftype == Thrift.Type.STRUCT) {
        this.b10 = new ThriftTest.Bools();
        this.b10.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 100:
      if (ftype == Thrift.Type.STRUCT) {
        this.b100 = new ThriftTest.Bools();
        this.b100.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 500:
      if (ftype == Thrift.Type.BOOL) {
        this.check_true = input.readBool().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 1000:
      if (ftype == Thrift.Type.STRUCT) {
        this.b1000 = new ThriftTest.Bools();
        this.b1000.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 1500:
      if (ftype == Thrift.Type.BOOL) {
        this.check_false = input.readBool().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 2000:
      if (ftype == Thrift.Type.STRUCT) {
        this.vertwo2000 = new ThriftTest.VersioningTestV2();
        this.vertwo2000.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 2500:
      if (ftype == Thrift.Type.SET) {
        this.a_set2500 = [];
        var _rtmp3100 = input.readSetBegin();
        var _size99 = _rtmp3100.size || 0;
        for (var _i101 = 0; _i101 < _size99; ++_i101) {
          var elem102 = null;
          elem102 = input.readString().value;
          this.a_set2500.push(elem102);
        }
        input.readSetEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 3000:
      if (ftype == Thrift.Type.STRUCT) {
        this.vertwo3000 = new ThriftTest.VersioningTestV2();
        this.vertwo3000.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 4000:
      if (ftype == Thrift.Type.LIST) {
        this.big_numbers = [];
        var _rtmp3104 = input.readListBegin();
        var _size103 = _rtmp3104.size || 0;
        for (var _i105 = 0; _i105 < _size103; ++_i105) {
          var elem106 = null;
          elem106 = input.readI32().value;
          this.big_numbers.push(elem106);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.LargeDeltas.prototype.write = function(output) {
  output.writeStructBegin('LargeDeltas');
  if (this.b1 !== null && this.b1 !== undefined) {
    output.writeFieldBegin('b1', Thrift.Type.STRUCT, 1);
    this.b1.write(output);
    output.writeFieldEnd();
  }
  if (this.b10 !== null && this.b10 !== undefined) {
    output.writeFieldBegin('b10', Thrift.Type.STRUCT, 10);
    this.b10.write(output);
    output.writeFieldEnd();
  }
  if (this.b100 !== null && this.b100 !== undefined) {
    output.writeFieldBegin('b100', Thrift.Type.STRUCT, 100);
    this.b100.write(output);
    output.writeFieldEnd();
  }
  if (this.check_true !== null && this.check_true !== undefined) {
    output.writeFieldBegin('check_true', Thrift.Type.BOOL, 500);
    output.writeBool(this.check_true);
    output.writeFieldEnd();
  }
  if (this.b1000 !== null && this.b1000 !== undefined) {
    output.writeFieldBegin('b1000', Thrift.Type.STRUCT, 1000);
    this.b1000.write(output);
    output.writeFieldEnd();
  }
  if (this.check_false !== null && this.check_false !== undefined) {
    output.writeFieldBegin('check_false', Thrift.Type.BOOL, 1500);
    output.writeBool(this.check_false);
    output.writeFieldEnd();
  }
  if (this.vertwo2000 !== null && this.vertwo2000 !== undefined) {
    output.writeFieldBegin('vertwo2000', Thrift.Type.STRUCT, 2000);
    this.vertwo2000.write(output);
    output.writeFieldEnd();
  }
  if (this.a_set2500 !== null && this.a_set2500 !== undefined) {
    output.writeFieldBegin('a_set2500', Thrift.Type.SET, 2500);
    output.writeSetBegin(Thrift.Type.STRING, this.a_set2500.length);
    for (var iter107 in this.a_set2500) {
      if (this.a_set2500.hasOwnProperty(iter107)) {
        iter107 = this.a_set2500[iter107];
        output.writeString(iter107);
      }
    }
    output.writeSetEnd();
    output.writeFieldEnd();
  }
  if (this.vertwo3000 !== null && this.vertwo3000 !== undefined) {
    output.writeFieldBegin('vertwo3000', Thrift.Type.STRUCT, 3000);
    this.vertwo3000.write(output);
    output.writeFieldEnd();
  }
  if (this.big_numbers !== null && this.big_numbers !== undefined) {
    output.writeFieldBegin('big_numbers', Thrift.Type.LIST, 4000);
    output.writeListBegin(Thrift.Type.I32, this.big_numbers.length);
    for (var iter108 in this.big_numbers) {
      if (this.big_numbers.hasOwnProperty(iter108)) {
        iter108 = this.big_numbers[iter108];
        output.writeI32(iter108);
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.NestedListsI32x2 = function(args) {
  this.integerlist = null;
  if (args) {
    if (args.integerlist !== undefined && args.integerlist !== null) {
      this.integerlist = Thrift.copyList(args.integerlist, [Thrift.copyList, null]);
    }
  }
};
ThriftTest.NestedListsI32x2.prototype = {};
ThriftTest.NestedListsI32x2.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.LIST) {
        this.integerlist = [];
        var _rtmp3110 = input.readListBegin();
        var _size109 = _rtmp3110.size || 0;
        for (var _i111 = 0; _i111 < _size109; ++_i111) {
          var elem112 = null;
          elem112 = [];
          var _rtmp3114 = input.readListBegin();
          var _size113 = _rtmp3114.size || 0;
          for (var _i115 = 0; _i115 < _size113; ++_i115) {
            var elem116 = null;
            elem116 = input.readI32().value;
            elem112.push(elem116);
          }
          input.readListEnd();
          this.integerlist.push(elem112);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 0:
        input.skip(ftype);
        break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.NestedListsI32x2.prototype.write = function(output) {
  output.writeStructBegin('NestedListsI32x2');
  if (this.integerlist !== null && this.integerlist !== undefined) {
    output.writeFieldBegin('integerlist', Thrift.Type.LIST, 1);
    output.writeListBegin(Thrift.Type.LIST, this.integerlist.length);
    for (var iter117 in this.integerlist) {
      if (this.integerlist.hasOwnProperty(iter117)) {
        iter117 = this.integerlist[iter117];
        output.writeListBegin(Thrift.Type.I32, iter117.length);
        for (var iter118 in iter117) {
          if (iter117.hasOwnProperty(iter118)) {
            iter118 = iter117[iter118];
            output.writeI32(iter118);
          }
        }
        output.writeListEnd();
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.NestedListsI32x3 = function(args) {
  this.integerlist = null;
  if (args) {
    if (args.integerlist !== undefined && args.integerlist !== null) {
      this.integerlist = Thrift.copyList(args.integerlist, [Thrift.copyList, Thrift.copyList, null]);
    }
  }
};
ThriftTest.NestedListsI32x3.prototype = {};
ThriftTest.NestedListsI32x3.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.LIST) {
        this.integerlist = [];
        var _rtmp3120 = input.readListBegin();
        var _size119 = _rtmp3120.size || 0;
        for (var _i121 = 0; _i121 < _size119; ++_i121) {
          var elem122 = null;
          elem122 = [];
          var _rtmp3124 = input.readListBegin();
          var _size123 = _rtmp3124.size || 0;
          for (var _i125 = 0; _i125 < _size123; ++_i125) {
            var elem126 = null;
            elem126 = [];
            var _rtmp3128 = input.readListBegin();
            var _size127 = _rtmp3128.size || 0;
            for (var _i129 = 0; _i129 < _size127; ++_i129) {
              var elem130 = null;
              elem130 = input.readI32().value;
              elem126.push(elem130);
            }
            input.readListEnd();
            elem122.push(elem126);
          }
          input.readListEnd();
          this.integerlist.push(elem122);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 0:
        input.skip(ftype);
        break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.NestedListsI32x3.prototype.write = function(output) {
  output.writeStructBegin('NestedListsI32x3');
  if (this.integerlist !== null && this.integerlist !== undefined) {
    output.writeFieldBegin('integerlist', Thrift.Type.LIST, 1);
    output.writeListBegin(Thrift.Type.LIST, this.integerlist.length);
    for (var iter131 in this.integerlist) {
      if (this.integerlist.hasOwnProperty(iter131)) {
        iter131 = this.integerlist[iter131];
        output.writeListBegin(Thrift.Type.LIST, iter131.length);
        for (var iter132 in iter131) {
          if (iter131.hasOwnProperty(iter132)) {
            iter132 = iter131[iter132];
            output.writeListBegin(Thrift.Type.I32, iter132.length);
            for (var iter133 in iter132) {
              if (iter132.hasOwnProperty(iter133)) {
                iter133 = iter132[iter133];
                output.writeI32(iter133);
              }
            }
            output.writeListEnd();
          }
        }
        output.writeListEnd();
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.NestedMixedx2 = function(args) {
  this.int_set_list = null;
  this.map_int_strset = null;
  this.map_int_strset_list = null;
  if (args) {
    if (args.int_set_list !== undefined && args.int_set_list !== null) {
      this.int_set_list = Thrift.copyList(args.int_set_list, [Thrift.copyList, null]);
    }
    if (args.map_int_strset !== undefined && args.map_int_strset !== null) {
      this.map_int_strset = Thrift.copyMap(args.map_int_strset, [Thrift.copyList, null]);
    }
    if (args.map_int_strset_list !== undefined && args.map_int_strset_list !== null) {
      this.map_int_strset_list = Thrift.copyList(args.map_int_strset_list, [Thrift.copyMap, Thrift.copyList, null]);
    }
  }
};
ThriftTest.NestedMixedx2.prototype = {};
ThriftTest.NestedMixedx2.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.LIST) {
        this.int_set_list = [];
        var _rtmp3135 = input.readListBegin();
        var _size134 = _rtmp3135.size || 0;
        for (var _i136 = 0; _i136 < _size134; ++_i136) {
          var elem137 = null;
          elem137 = [];
          var _rtmp3139 = input.readSetBegin();
          var _size138 = _rtmp3139.size || 0;
          for (var _i140 = 0; _i140 < _size138; ++_i140) {
            var elem141 = null;
            elem141 = input.readI32().value;
            elem137.push(elem141);
          }
          input.readSetEnd();
          this.int_set_list.push(elem137);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.MAP) {
        this.map_int_strset = {};
        var _rtmp3143 = input.readMapBegin();
        var _size142 = _rtmp3143.size || 0;
        for (var _i144 = 0; _i144 < _size142; ++_i144) {
          if (_i144 > 0 ) {
            if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
              input.rstack.pop();
            }
          }
          var key145 = null;
          var val146 = null;
          key145 = input.readI32().value;
          val146 = [];
          var _rtmp3148 = input.readSetBegin();
          var _size147 = _rtmp3148.size || 0;
          for (var _i149 = 0; _i149 < _size147; ++_i149) {
            var elem150 = null;
            elem150 = input.readString().value;
            val146.push(elem150);
          }
          input.readSetEnd();
          this.map_int_strset[key145] = val146;
        }
        input.readMapEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 3:
      if (ftype == Thrift.Type.LIST) {
        this.map_int_strset_list = [];
        var _rtmp3152 = input.readListBegin();
        var _size151 = _rtmp3152.size || 0;
        for (var _i153 = 0; _i153 < _size151; ++_i153) {
          var elem154 = null;
          elem154 = {};
          var _rtmp3156 = input.readMapBegin();
          var _size155 = _rtmp3156.size || 0;
          for (var _i157 = 0; _i157 < _size155; ++_i157) {
            if (_i157 > 0 ) {
              if (input.rstack.length > input.rpos[input.rpos.length -1] + 1) {
                input.rstack.pop();
              }
            }
            var key158 = null;
            var val159 = null;
            key158 = input.readI32().value;
            val159 = [];
            var _rtmp3161 = input.readSetBegin();
            var _size160 = _rtmp3161.size || 0;
            for (var _i162 = 0; _i162 < _size160; ++_i162) {
              var elem163 = null;
              elem163 = input.readString().value;
              val159.push(elem163);
            }
            input.readSetEnd();
            elem154[key158] = val159;
          }
          input.readMapEnd();
          this.map_int_strset_list.push(elem154);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.NestedMixedx2.prototype.write = function(output) {
  output.writeStructBegin('NestedMixedx2');
  if (this.int_set_list !== null && this.int_set_list !== undefined) {
    output.writeFieldBegin('int_set_list', Thrift.Type.LIST, 1);
    output.writeListBegin(Thrift.Type.SET, this.int_set_list.length);
    for (var iter164 in this.int_set_list) {
      if (this.int_set_list.hasOwnProperty(iter164)) {
        iter164 = this.int_set_list[iter164];
        output.writeSetBegin(Thrift.Type.I32, iter164.length);
        for (var iter165 in iter164) {
          if (iter164.hasOwnProperty(iter165)) {
            iter165 = iter164[iter165];
            output.writeI32(iter165);
          }
        }
        output.writeSetEnd();
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  if (this.map_int_strset !== null && this.map_int_strset !== undefined) {
    output.writeFieldBegin('map_int_strset', Thrift.Type.MAP, 2);
    output.writeMapBegin(Thrift.Type.I32, Thrift.Type.SET, Thrift.objectLength(this.map_int_strset));
    for (var kiter166 in this.map_int_strset) {
      if (this.map_int_strset.hasOwnProperty(kiter166)) {
        var viter167 = this.map_int_strset[kiter166];
        output.writeI32(kiter166);
        output.writeSetBegin(Thrift.Type.STRING, viter167.length);
        for (var iter168 in viter167) {
          if (viter167.hasOwnProperty(iter168)) {
            iter168 = viter167[iter168];
            output.writeString(iter168);
          }
        }
        output.writeSetEnd();
      }
    }
    output.writeMapEnd();
    output.writeFieldEnd();
  }
  if (this.map_int_strset_list !== null && this.map_int_strset_list !== undefined) {
    output.writeFieldBegin('map_int_strset_list', Thrift.Type.LIST, 3);
    output.writeListBegin(Thrift.Type.MAP, this.map_int_strset_list.length);
    for (var iter169 in this.map_int_strset_list) {
      if (this.map_int_strset_list.hasOwnProperty(iter169)) {
        iter169 = this.map_int_strset_list[iter169];
        output.writeMapBegin(Thrift.Type.I32, Thrift.Type.SET, Thrift.objectLength(iter169));
        for (var kiter170 in iter169) {
          if (iter169.hasOwnProperty(kiter170)) {
            var viter171 = iter169[kiter170];
            output.writeI32(kiter170);
            output.writeSetBegin(Thrift.Type.STRING, viter171.length);
            for (var iter172 in viter171) {
              if (viter171.hasOwnProperty(iter172)) {
                iter172 = viter171[iter172];
                output.writeString(iter172);
              }
            }
            output.writeSetEnd();
          }
        }
        output.writeMapEnd();
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.ListBonks = function(args) {
  this.bonk = null;
  if (args) {
    if (args.bonk !== undefined && args.bonk !== null) {
      this.bonk = Thrift.copyList(args.bonk, [ThriftTest.Bonk]);
    }
  }
};
ThriftTest.ListBonks.prototype = {};
ThriftTest.ListBonks.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.LIST) {
        this.bonk = [];
        var _rtmp3174 = input.readListBegin();
        var _size173 = _rtmp3174.size || 0;
        for (var _i175 = 0; _i175 < _size173; ++_i175) {
          var elem176 = null;
          elem176 = new ThriftTest.Bonk();
          elem176.read(input);
          this.bonk.push(elem176);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 0:
        input.skip(ftype);
        break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.ListBonks.prototype.write = function(output) {
  output.writeStructBegin('ListBonks');
  if (this.bonk !== null && this.bonk !== undefined) {
    output.writeFieldBegin('bonk', Thrift.Type.LIST, 1);
    output.writeListBegin(Thrift.Type.STRUCT, this.bonk.length);
    for (var iter177 in this.bonk) {
      if (this.bonk.hasOwnProperty(iter177)) {
        iter177 = this.bonk[iter177];
        iter177.write(output);
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.NestedListsBonk = function(args) {
  this.bonk = null;
  if (args) {
    if (args.bonk !== undefined && args.bonk !== null) {
      this.bonk = Thrift.copyList(args.bonk, [Thrift.copyList, Thrift.copyList, ThriftTest.Bonk]);
    }
  }
};
ThriftTest.NestedListsBonk.prototype = {};
ThriftTest.NestedListsBonk.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.LIST) {
        this.bonk = [];
        var _rtmp3179 = input.readListBegin();
        var _size178 = _rtmp3179.size || 0;
        for (var _i180 = 0; _i180 < _size178; ++_i180) {
          var elem181 = null;
          elem181 = [];
          var _rtmp3183 = input.readListBegin();
          var _size182 = _rtmp3183.size || 0;
          for (var _i184 = 0; _i184 < _size182; ++_i184) {
            var elem185 = null;
            elem185 = [];
            var _rtmp3187 = input.readListBegin();
            var _size186 = _rtmp3187.size || 0;
            for (var _i188 = 0; _i188 < _size186; ++_i188) {
              var elem189 = null;
              elem189 = new ThriftTest.Bonk();
              elem189.read(input);
              elem185.push(elem189);
            }
            input.readListEnd();
            elem181.push(elem185);
          }
          input.readListEnd();
          this.bonk.push(elem181);
        }
        input.readListEnd();
      } else {
        input.skip(ftype);
      }
      break;
      case 0:
        input.skip(ftype);
        break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.NestedListsBonk.prototype.write = function(output) {
  output.writeStructBegin('NestedListsBonk');
  if (this.bonk !== null && this.bonk !== undefined) {
    output.writeFieldBegin('bonk', Thrift.Type.LIST, 1);
    output.writeListBegin(Thrift.Type.LIST, this.bonk.length);
    for (var iter190 in this.bonk) {
      if (this.bonk.hasOwnProperty(iter190)) {
        iter190 = this.bonk[iter190];
        output.writeListBegin(Thrift.Type.LIST, iter190.length);
        for (var iter191 in iter190) {
          if (iter190.hasOwnProperty(iter191)) {
            iter191 = iter190[iter191];
            output.writeListBegin(Thrift.Type.STRUCT, iter191.length);
            for (var iter192 in iter191) {
              if (iter191.hasOwnProperty(iter192)) {
                iter192 = iter191[iter192];
                iter192.write(output);
              }
            }
            output.writeListEnd();
          }
        }
        output.writeListEnd();
      }
    }
    output.writeListEnd();
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.BoolTest = function(args) {
  this.b = true;
  this.s = 'true';
  if (args) {
    if (args.b !== undefined && args.b !== null) {
      this.b = args.b;
    }
    if (args.s !== undefined && args.s !== null) {
      this.s = args.s;
    }
  }
};
ThriftTest.BoolTest.prototype = {};
ThriftTest.BoolTest.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.BOOL) {
        this.b = input.readBool().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.STRING) {
        this.s = input.readString().value;
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.BoolTest.prototype.write = function(output) {
  output.writeStructBegin('BoolTest');
  if (this.b !== null && this.b !== undefined) {
    output.writeFieldBegin('b', Thrift.Type.BOOL, 1);
    output.writeBool(this.b);
    output.writeFieldEnd();
  }
  if (this.s !== null && this.s !== undefined) {
    output.writeFieldBegin('s', Thrift.Type.STRING, 2);
    output.writeString(this.s);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.StructA = function(args) {
  this.s = null;
  if (args) {
    if (args.s !== undefined && args.s !== null) {
      this.s = args.s;
    } else {
      throw new Thrift.TProtocolException(Thrift.TProtocolExceptionType.UNKNOWN, 'Required field s is unset!');
    }
  }
};
ThriftTest.StructA.prototype = {};
ThriftTest.StructA.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.STRING) {
        this.s = input.readString().value;
      } else {
        input.skip(ftype);
      }
      break;
      case 0:
        input.skip(ftype);
        break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.StructA.prototype.write = function(output) {
  output.writeStructBegin('StructA');
  if (this.s !== null && this.s !== undefined) {
    output.writeFieldBegin('s', Thrift.Type.STRING, 1);
    output.writeString(this.s);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.StructB = function(args) {
  this.aa = null;
  this.ab = null;
  if (args) {
    if (args.aa !== undefined && args.aa !== null) {
      this.aa = new ThriftTest.StructA(args.aa);
    }
    if (args.ab !== undefined && args.ab !== null) {
      this.ab = new ThriftTest.StructA(args.ab);
    } else {
      throw new Thrift.TProtocolException(Thrift.TProtocolExceptionType.UNKNOWN, 'Required field ab is unset!');
    }
  }
};
ThriftTest.StructB.prototype = {};
ThriftTest.StructB.prototype.read = function(input) {
  input.readStructBegin();
  while (true) {
    var ret = input.readFieldBegin();
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid) {
      case 1:
      if (ftype == Thrift.Type.STRUCT) {
        this.aa = new ThriftTest.StructA();
        this.aa.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.STRUCT) {
        this.ab = new ThriftTest.StructA();
        this.ab.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ThriftTest.StructB.prototype.write = function(output) {
  output.writeStructBegin('StructB');
  if (this.aa !== null && this.aa !== undefined) {
    output.writeFieldBegin('aa', Thrift.Type.STRUCT, 1);
    this.aa.write(output);
    output.writeFieldEnd();
  }
  if (this.ab !== null && this.ab !== undefined) {
    output.writeFieldBegin('ab', Thrift.Type.STRUCT, 2);
    this.ab.write(output);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ThriftTest.myNumberz = 1;

},{"node-int64":8}],11:[function(require,module,exports){
/*!
 * QUnit 2.6.2
 * https://qunitjs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2018-08-19T19:37Z
 */
(function (global$1) {
  'use strict';

  global$1 = global$1 && global$1.hasOwnProperty('default') ? global$1['default'] : global$1;

  var window = global$1.window;
  var self$1 = global$1.self;
  var console = global$1.console;
  var setTimeout = global$1.setTimeout;
  var clearTimeout = global$1.clearTimeout;

  var document = window && window.document;
  var navigator = window && window.navigator;

  var localSessionStorage = function () {
  	var x = "qunit-test-string";
  	try {
  		global$1.sessionStorage.setItem(x, x);
  		global$1.sessionStorage.removeItem(x);
  		return global$1.sessionStorage;
  	} catch (e) {
  		return undefined;
  	}
  }();

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };











  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();









































  var toConsumableArray = function (arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    } else {
      return Array.from(arr);
    }
  };

  var toString = Object.prototype.toString;
  var hasOwn = Object.prototype.hasOwnProperty;
  var now = Date.now || function () {
  	return new Date().getTime();
  };

  var defined = {
  	document: window && window.document !== undefined,
  	setTimeout: setTimeout !== undefined
  };

  // Returns a new Array with the elements that are in a but not in b
  function diff(a, b) {
  	var i,
  	    j,
  	    result = a.slice();

  	for (i = 0; i < result.length; i++) {
  		for (j = 0; j < b.length; j++) {
  			if (result[i] === b[j]) {
  				result.splice(i, 1);
  				i--;
  				break;
  			}
  		}
  	}
  	return result;
  }

  /**
   * Determines whether an element exists in a given array or not.
   *
   * @method inArray
   * @param {Any} elem
   * @param {Array} array
   * @return {Boolean}
   */
  function inArray(elem, array) {
  	return array.indexOf(elem) !== -1;
  }

  /**
   * Makes a clone of an object using only Array or Object as base,
   * and copies over the own enumerable properties.
   *
   * @param {Object} obj
   * @return {Object} New object with only the own properties (recursively).
   */
  function objectValues(obj) {
  	var key,
  	    val,
  	    vals = is("array", obj) ? [] : {};
  	for (key in obj) {
  		if (hasOwn.call(obj, key)) {
  			val = obj[key];
  			vals[key] = val === Object(val) ? objectValues(val) : val;
  		}
  	}
  	return vals;
  }

  function extend(a, b, undefOnly) {
  	for (var prop in b) {
  		if (hasOwn.call(b, prop)) {
  			if (b[prop] === undefined) {
  				delete a[prop];
  			} else if (!(undefOnly && typeof a[prop] !== "undefined")) {
  				a[prop] = b[prop];
  			}
  		}
  	}

  	return a;
  }

  function objectType(obj) {
  	if (typeof obj === "undefined") {
  		return "undefined";
  	}

  	// Consider: typeof null === object
  	if (obj === null) {
  		return "null";
  	}

  	var match = toString.call(obj).match(/^\[object\s(.*)\]$/),
  	    type = match && match[1];

  	switch (type) {
  		case "Number":
  			if (isNaN(obj)) {
  				return "nan";
  			}
  			return "number";
  		case "String":
  		case "Boolean":
  		case "Array":
  		case "Set":
  		case "Map":
  		case "Date":
  		case "RegExp":
  		case "Function":
  		case "Symbol":
  			return type.toLowerCase();
  		default:
  			return typeof obj === "undefined" ? "undefined" : _typeof(obj);
  	}
  }

  // Safe object type checking
  function is(type, obj) {
  	return objectType(obj) === type;
  }

  // Based on Java's String.hashCode, a simple but not
  // rigorously collision resistant hashing function
  function generateHash(module, testName) {
  	var str = module + "\x1C" + testName;
  	var hash = 0;

  	for (var i = 0; i < str.length; i++) {
  		hash = (hash << 5) - hash + str.charCodeAt(i);
  		hash |= 0;
  	}

  	// Convert the possibly negative integer hash code into an 8 character hex string, which isn't
  	// strictly necessary but increases user understanding that the id is a SHA-like hash
  	var hex = (0x100000000 + hash).toString(16);
  	if (hex.length < 8) {
  		hex = "0000000" + hex;
  	}

  	return hex.slice(-8);
  }

  // Test for equality any JavaScript type.
  // Authors: Philippe Rathé <prathe@gmail.com>, David Chan <david@troi.org>
  var equiv = (function () {

  	// Value pairs queued for comparison. Used for breadth-first processing order, recursion
  	// detection and avoiding repeated comparison (see below for details).
  	// Elements are { a: val, b: val }.
  	var pairs = [];

  	var getProto = Object.getPrototypeOf || function (obj) {
  		return obj.__proto__;
  	};

  	function useStrictEquality(a, b) {

  		// This only gets called if a and b are not strict equal, and is used to compare on
  		// the primitive values inside object wrappers. For example:
  		// `var i = 1;`
  		// `var j = new Number(1);`
  		// Neither a nor b can be null, as a !== b and they have the same type.
  		if ((typeof a === "undefined" ? "undefined" : _typeof(a)) === "object") {
  			a = a.valueOf();
  		}
  		if ((typeof b === "undefined" ? "undefined" : _typeof(b)) === "object") {
  			b = b.valueOf();
  		}

  		return a === b;
  	}

  	function compareConstructors(a, b) {
  		var protoA = getProto(a);
  		var protoB = getProto(b);

  		// Comparing constructors is more strict than using `instanceof`
  		if (a.constructor === b.constructor) {
  			return true;
  		}

  		// Ref #851
  		// If the obj prototype descends from a null constructor, treat it
  		// as a null prototype.
  		if (protoA && protoA.constructor === null) {
  			protoA = null;
  		}
  		if (protoB && protoB.constructor === null) {
  			protoB = null;
  		}

  		// Allow objects with no prototype to be equivalent to
  		// objects with Object as their constructor.
  		if (protoA === null && protoB === Object.prototype || protoB === null && protoA === Object.prototype) {
  			return true;
  		}

  		return false;
  	}

  	function getRegExpFlags(regexp) {
  		return "flags" in regexp ? regexp.flags : regexp.toString().match(/[gimuy]*$/)[0];
  	}

  	function isContainer(val) {
  		return ["object", "array", "map", "set"].indexOf(objectType(val)) !== -1;
  	}

  	function breadthFirstCompareChild(a, b) {

  		// If a is a container not reference-equal to b, postpone the comparison to the
  		// end of the pairs queue -- unless (a, b) has been seen before, in which case skip
  		// over the pair.
  		if (a === b) {
  			return true;
  		}
  		if (!isContainer(a)) {
  			return typeEquiv(a, b);
  		}
  		if (pairs.every(function (pair) {
  			return pair.a !== a || pair.b !== b;
  		})) {

  			// Not yet started comparing this pair
  			pairs.push({ a: a, b: b });
  		}
  		return true;
  	}

  	var callbacks = {
  		"string": useStrictEquality,
  		"boolean": useStrictEquality,
  		"number": useStrictEquality,
  		"null": useStrictEquality,
  		"undefined": useStrictEquality,
  		"symbol": useStrictEquality,
  		"date": useStrictEquality,

  		"nan": function nan() {
  			return true;
  		},

  		"regexp": function regexp(a, b) {
  			return a.source === b.source &&

  			// Include flags in the comparison
  			getRegExpFlags(a) === getRegExpFlags(b);
  		},

  		// abort (identical references / instance methods were skipped earlier)
  		"function": function _function() {
  			return false;
  		},

  		"array": function array(a, b) {
  			var i, len;

  			len = a.length;
  			if (len !== b.length) {

  				// Safe and faster
  				return false;
  			}

  			for (i = 0; i < len; i++) {

  				// Compare non-containers; queue non-reference-equal containers
  				if (!breadthFirstCompareChild(a[i], b[i])) {
  					return false;
  				}
  			}
  			return true;
  		},

  		// Define sets a and b to be equivalent if for each element aVal in a, there
  		// is some element bVal in b such that aVal and bVal are equivalent. Element
  		// repetitions are not counted, so these are equivalent:
  		// a = new Set( [ {}, [], [] ] );
  		// b = new Set( [ {}, {}, [] ] );
  		"set": function set$$1(a, b) {
  			var innerEq,
  			    outerEq = true;

  			if (a.size !== b.size) {

  				// This optimization has certain quirks because of the lack of
  				// repetition counting. For instance, adding the same
  				// (reference-identical) element to two equivalent sets can
  				// make them non-equivalent.
  				return false;
  			}

  			a.forEach(function (aVal) {

  				// Short-circuit if the result is already known. (Using for...of
  				// with a break clause would be cleaner here, but it would cause
  				// a syntax error on older Javascript implementations even if
  				// Set is unused)
  				if (!outerEq) {
  					return;
  				}

  				innerEq = false;

  				b.forEach(function (bVal) {
  					var parentPairs;

  					// Likewise, short-circuit if the result is already known
  					if (innerEq) {
  						return;
  					}

  					// Swap out the global pairs list, as the nested call to
  					// innerEquiv will clobber its contents
  					parentPairs = pairs;
  					if (innerEquiv(bVal, aVal)) {
  						innerEq = true;
  					}

  					// Replace the global pairs list
  					pairs = parentPairs;
  				});

  				if (!innerEq) {
  					outerEq = false;
  				}
  			});

  			return outerEq;
  		},

  		// Define maps a and b to be equivalent if for each key-value pair (aKey, aVal)
  		// in a, there is some key-value pair (bKey, bVal) in b such that
  		// [ aKey, aVal ] and [ bKey, bVal ] are equivalent. Key repetitions are not
  		// counted, so these are equivalent:
  		// a = new Map( [ [ {}, 1 ], [ {}, 1 ], [ [], 1 ] ] );
  		// b = new Map( [ [ {}, 1 ], [ [], 1 ], [ [], 1 ] ] );
  		"map": function map(a, b) {
  			var innerEq,
  			    outerEq = true;

  			if (a.size !== b.size) {

  				// This optimization has certain quirks because of the lack of
  				// repetition counting. For instance, adding the same
  				// (reference-identical) key-value pair to two equivalent maps
  				// can make them non-equivalent.
  				return false;
  			}

  			a.forEach(function (aVal, aKey) {

  				// Short-circuit if the result is already known. (Using for...of
  				// with a break clause would be cleaner here, but it would cause
  				// a syntax error on older Javascript implementations even if
  				// Map is unused)
  				if (!outerEq) {
  					return;
  				}

  				innerEq = false;

  				b.forEach(function (bVal, bKey) {
  					var parentPairs;

  					// Likewise, short-circuit if the result is already known
  					if (innerEq) {
  						return;
  					}

  					// Swap out the global pairs list, as the nested call to
  					// innerEquiv will clobber its contents
  					parentPairs = pairs;
  					if (innerEquiv([bVal, bKey], [aVal, aKey])) {
  						innerEq = true;
  					}

  					// Replace the global pairs list
  					pairs = parentPairs;
  				});

  				if (!innerEq) {
  					outerEq = false;
  				}
  			});

  			return outerEq;
  		},

  		"object": function object(a, b) {
  			var i,
  			    aProperties = [],
  			    bProperties = [];

  			if (compareConstructors(a, b) === false) {
  				return false;
  			}

  			// Be strict: don't ensure hasOwnProperty and go deep
  			for (i in a) {

  				// Collect a's properties
  				aProperties.push(i);

  				// Skip OOP methods that look the same
  				if (a.constructor !== Object && typeof a.constructor !== "undefined" && typeof a[i] === "function" && typeof b[i] === "function" && a[i].toString() === b[i].toString()) {
  					continue;
  				}

  				// Compare non-containers; queue non-reference-equal containers
  				if (!breadthFirstCompareChild(a[i], b[i])) {
  					return false;
  				}
  			}

  			for (i in b) {

  				// Collect b's properties
  				bProperties.push(i);
  			}

  			// Ensures identical properties name
  			return typeEquiv(aProperties.sort(), bProperties.sort());
  		}
  	};

  	function typeEquiv(a, b) {
  		var type = objectType(a);

  		// Callbacks for containers will append to the pairs queue to achieve breadth-first
  		// search order. The pairs queue is also used to avoid reprocessing any pair of
  		// containers that are reference-equal to a previously visited pair (a special case
  		// this being recursion detection).
  		//
  		// Because of this approach, once typeEquiv returns a false value, it should not be
  		// called again without clearing the pair queue else it may wrongly report a visited
  		// pair as being equivalent.
  		return objectType(b) === type && callbacks[type](a, b);
  	}

  	function innerEquiv(a, b) {
  		var i, pair;

  		// We're done when there's nothing more to compare
  		if (arguments.length < 2) {
  			return true;
  		}

  		// Clear the global pair queue and add the top-level values being compared
  		pairs = [{ a: a, b: b }];

  		for (i = 0; i < pairs.length; i++) {
  			pair = pairs[i];

  			// Perform type-specific comparison on any pairs that are not strictly
  			// equal. For container types, that comparison will postpone comparison
  			// of any sub-container pair to the end of the pair queue. This gives
  			// breadth-first search order. It also avoids the reprocessing of
  			// reference-equal siblings, cousins etc, which can have a significant speed
  			// impact when comparing a container of small objects each of which has a
  			// reference to the same (singleton) large object.
  			if (pair.a !== pair.b && !typeEquiv(pair.a, pair.b)) {
  				return false;
  			}
  		}

  		// ...across all consecutive argument pairs
  		return arguments.length === 2 || innerEquiv.apply(this, [].slice.call(arguments, 1));
  	}

  	return function () {
  		var result = innerEquiv.apply(undefined, arguments);

  		// Release any retained objects
  		pairs.length = 0;
  		return result;
  	};
  })();

  /**
   * Config object: Maintain internal state
   * Later exposed as QUnit.config
   * `config` initialized at top of scope
   */
  var config = {

  	// The queue of tests to run
  	queue: [],

  	// Block until document ready
  	blocking: true,

  	// By default, run previously failed tests first
  	// very useful in combination with "Hide passed tests" checked
  	reorder: true,

  	// By default, modify document.title when suite is done
  	altertitle: true,

  	// HTML Reporter: collapse every test except the first failing test
  	// If false, all failing tests will be expanded
  	collapse: true,

  	// By default, scroll to top of the page when suite is done
  	scrolltop: true,

  	// Depth up-to which object will be dumped
  	maxDepth: 5,

  	// When enabled, all tests must call expect()
  	requireExpects: false,

  	// Placeholder for user-configurable form-exposed URL parameters
  	urlConfig: [],

  	// Set of all modules.
  	modules: [],

  	// The first unnamed module
  	currentModule: {
  		name: "",
  		tests: [],
  		childModules: [],
  		testsRun: 0,
  		unskippedTestsRun: 0,
  		hooks: {
  			before: [],
  			beforeEach: [],
  			afterEach: [],
  			after: []
  		}
  	},

  	callbacks: {},

  	// The storage module to use for reordering tests
  	storage: localSessionStorage
  };

  // take a predefined QUnit.config and extend the defaults
  var globalConfig = window && window.QUnit && window.QUnit.config;

  // only extend the global config if there is no QUnit overload
  if (window && window.QUnit && !window.QUnit.version) {
  	extend(config, globalConfig);
  }

  // Push a loose unnamed module to the modules collection
  config.modules.push(config.currentModule);

  // Based on jsDump by Ariel Flesler
  // http://flesler.blogspot.com/2008/05/jsdump-pretty-dump-of-any-javascript.html
  var dump = (function () {
  	function quote(str) {
  		return "\"" + str.toString().replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"";
  	}
  	function literal(o) {
  		return o + "";
  	}
  	function join(pre, arr, post) {
  		var s = dump.separator(),
  		    base = dump.indent(),
  		    inner = dump.indent(1);
  		if (arr.join) {
  			arr = arr.join("," + s + inner);
  		}
  		if (!arr) {
  			return pre + post;
  		}
  		return [pre, inner + arr, base + post].join(s);
  	}
  	function array(arr, stack) {
  		var i = arr.length,
  		    ret = new Array(i);

  		if (dump.maxDepth && dump.depth > dump.maxDepth) {
  			return "[object Array]";
  		}

  		this.up();
  		while (i--) {
  			ret[i] = this.parse(arr[i], undefined, stack);
  		}
  		this.down();
  		return join("[", ret, "]");
  	}

  	function isArray(obj) {
  		return (

  			//Native Arrays
  			toString.call(obj) === "[object Array]" ||

  			// NodeList objects
  			typeof obj.length === "number" && obj.item !== undefined && (obj.length ? obj.item(0) === obj[0] : obj.item(0) === null && obj[0] === undefined)
  		);
  	}

  	var reName = /^function (\w+)/,
  	    dump = {

  		// The objType is used mostly internally, you can fix a (custom) type in advance
  		parse: function parse(obj, objType, stack) {
  			stack = stack || [];
  			var res,
  			    parser,
  			    parserType,
  			    objIndex = stack.indexOf(obj);

  			if (objIndex !== -1) {
  				return "recursion(" + (objIndex - stack.length) + ")";
  			}

  			objType = objType || this.typeOf(obj);
  			parser = this.parsers[objType];
  			parserType = typeof parser === "undefined" ? "undefined" : _typeof(parser);

  			if (parserType === "function") {
  				stack.push(obj);
  				res = parser.call(this, obj, stack);
  				stack.pop();
  				return res;
  			}
  			return parserType === "string" ? parser : this.parsers.error;
  		},
  		typeOf: function typeOf(obj) {
  			var type;

  			if (obj === null) {
  				type = "null";
  			} else if (typeof obj === "undefined") {
  				type = "undefined";
  			} else if (is("regexp", obj)) {
  				type = "regexp";
  			} else if (is("date", obj)) {
  				type = "date";
  			} else if (is("function", obj)) {
  				type = "function";
  			} else if (obj.setInterval !== undefined && obj.document !== undefined && obj.nodeType === undefined) {
  				type = "window";
  			} else if (obj.nodeType === 9) {
  				type = "document";
  			} else if (obj.nodeType) {
  				type = "node";
  			} else if (isArray(obj)) {
  				type = "array";
  			} else if (obj.constructor === Error.prototype.constructor) {
  				type = "error";
  			} else {
  				type = typeof obj === "undefined" ? "undefined" : _typeof(obj);
  			}
  			return type;
  		},

  		separator: function separator() {
  			if (this.multiline) {
  				return this.HTML ? "<br />" : "\n";
  			} else {
  				return this.HTML ? "&#160;" : " ";
  			}
  		},

  		// Extra can be a number, shortcut for increasing-calling-decreasing
  		indent: function indent(extra) {
  			if (!this.multiline) {
  				return "";
  			}
  			var chr = this.indentChar;
  			if (this.HTML) {
  				chr = chr.replace(/\t/g, "   ").replace(/ /g, "&#160;");
  			}
  			return new Array(this.depth + (extra || 0)).join(chr);
  		},
  		up: function up(a) {
  			this.depth += a || 1;
  		},
  		down: function down(a) {
  			this.depth -= a || 1;
  		},
  		setParser: function setParser(name, parser) {
  			this.parsers[name] = parser;
  		},

  		// The next 3 are exposed so you can use them
  		quote: quote,
  		literal: literal,
  		join: join,
  		depth: 1,
  		maxDepth: config.maxDepth,

  		// This is the list of parsers, to modify them, use dump.setParser
  		parsers: {
  			window: "[Window]",
  			document: "[Document]",
  			error: function error(_error) {
  				return "Error(\"" + _error.message + "\")";
  			},
  			unknown: "[Unknown]",
  			"null": "null",
  			"undefined": "undefined",
  			"function": function _function(fn) {
  				var ret = "function",


  				// Functions never have name in IE
  				name = "name" in fn ? fn.name : (reName.exec(fn) || [])[1];

  				if (name) {
  					ret += " " + name;
  				}
  				ret += "(";

  				ret = [ret, dump.parse(fn, "functionArgs"), "){"].join("");
  				return join(ret, dump.parse(fn, "functionCode"), "}");
  			},
  			array: array,
  			nodelist: array,
  			"arguments": array,
  			object: function object(map, stack) {
  				var keys,
  				    key,
  				    val,
  				    i,
  				    nonEnumerableProperties,
  				    ret = [];

  				if (dump.maxDepth && dump.depth > dump.maxDepth) {
  					return "[object Object]";
  				}

  				dump.up();
  				keys = [];
  				for (key in map) {
  					keys.push(key);
  				}

  				// Some properties are not always enumerable on Error objects.
  				nonEnumerableProperties = ["message", "name"];
  				for (i in nonEnumerableProperties) {
  					key = nonEnumerableProperties[i];
  					if (key in map && !inArray(key, keys)) {
  						keys.push(key);
  					}
  				}
  				keys.sort();
  				for (i = 0; i < keys.length; i++) {
  					key = keys[i];
  					val = map[key];
  					ret.push(dump.parse(key, "key") + ": " + dump.parse(val, undefined, stack));
  				}
  				dump.down();
  				return join("{", ret, "}");
  			},
  			node: function node(_node) {
  				var len,
  				    i,
  				    val,
  				    open = dump.HTML ? "&lt;" : "<",
  				    close = dump.HTML ? "&gt;" : ">",
  				    tag = _node.nodeName.toLowerCase(),
  				    ret = open + tag,
  				    attrs = _node.attributes;

  				if (attrs) {
  					for (i = 0, len = attrs.length; i < len; i++) {
  						val = attrs[i].nodeValue;

  						// IE6 includes all attributes in .attributes, even ones not explicitly
  						// set. Those have values like undefined, null, 0, false, "" or
  						// "inherit".
  						if (val && val !== "inherit") {
  							ret += " " + attrs[i].nodeName + "=" + dump.parse(val, "attribute");
  						}
  					}
  				}
  				ret += close;

  				// Show content of TextNode or CDATASection
  				if (_node.nodeType === 3 || _node.nodeType === 4) {
  					ret += _node.nodeValue;
  				}

  				return ret + open + "/" + tag + close;
  			},

  			// Function calls it internally, it's the arguments part of the function
  			functionArgs: function functionArgs(fn) {
  				var args,
  				    l = fn.length;

  				if (!l) {
  					return "";
  				}

  				args = new Array(l);
  				while (l--) {

  					// 97 is 'a'
  					args[l] = String.fromCharCode(97 + l);
  				}
  				return " " + args.join(", ") + " ";
  			},

  			// Object calls it internally, the key part of an item in a map
  			key: quote,

  			// Function calls it internally, it's the content of the function
  			functionCode: "[code]",

  			// Node calls it internally, it's a html attribute value
  			attribute: quote,
  			string: quote,
  			date: quote,
  			regexp: literal,
  			number: literal,
  			"boolean": literal,
  			symbol: function symbol(sym) {
  				return sym.toString();
  			}
  		},

  		// If true, entities are escaped ( <, >, \t, space and \n )
  		HTML: false,

  		// Indentation unit
  		indentChar: "  ",

  		// If true, items in a collection, are separated by a \n, else just a space.
  		multiline: true
  	};

  	return dump;
  })();

  var SuiteReport = function () {
  	function SuiteReport(name, parentSuite) {
  		classCallCheck(this, SuiteReport);

  		this.name = name;
  		this.fullName = parentSuite ? parentSuite.fullName.concat(name) : [];

  		this.tests = [];
  		this.childSuites = [];

  		if (parentSuite) {
  			parentSuite.pushChildSuite(this);
  		}
  	}

  	createClass(SuiteReport, [{
  		key: "start",
  		value: function start(recordTime) {
  			if (recordTime) {
  				this._startTime = Date.now();
  			}

  			return {
  				name: this.name,
  				fullName: this.fullName.slice(),
  				tests: this.tests.map(function (test) {
  					return test.start();
  				}),
  				childSuites: this.childSuites.map(function (suite) {
  					return suite.start();
  				}),
  				testCounts: {
  					total: this.getTestCounts().total
  				}
  			};
  		}
  	}, {
  		key: "end",
  		value: function end(recordTime) {
  			if (recordTime) {
  				this._endTime = Date.now();
  			}

  			return {
  				name: this.name,
  				fullName: this.fullName.slice(),
  				tests: this.tests.map(function (test) {
  					return test.end();
  				}),
  				childSuites: this.childSuites.map(function (suite) {
  					return suite.end();
  				}),
  				testCounts: this.getTestCounts(),
  				runtime: this.getRuntime(),
  				status: this.getStatus()
  			};
  		}
  	}, {
  		key: "pushChildSuite",
  		value: function pushChildSuite(suite) {
  			this.childSuites.push(suite);
  		}
  	}, {
  		key: "pushTest",
  		value: function pushTest(test) {
  			this.tests.push(test);
  		}
  	}, {
  		key: "getRuntime",
  		value: function getRuntime() {
  			return this._endTime - this._startTime;
  		}
  	}, {
  		key: "getTestCounts",
  		value: function getTestCounts() {
  			var counts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { passed: 0, failed: 0, skipped: 0, todo: 0, total: 0 };

  			counts = this.tests.reduce(function (counts, test) {
  				if (test.valid) {
  					counts[test.getStatus()]++;
  					counts.total++;
  				}

  				return counts;
  			}, counts);

  			return this.childSuites.reduce(function (counts, suite) {
  				return suite.getTestCounts(counts);
  			}, counts);
  		}
  	}, {
  		key: "getStatus",
  		value: function getStatus() {
  			var _getTestCounts = this.getTestCounts(),
  			    total = _getTestCounts.total,
  			    failed = _getTestCounts.failed,
  			    skipped = _getTestCounts.skipped,
  			    todo = _getTestCounts.todo;

  			if (failed) {
  				return "failed";
  			} else {
  				if (skipped === total) {
  					return "skipped";
  				} else if (todo === total) {
  					return "todo";
  				} else {
  					return "passed";
  				}
  			}
  		}
  	}]);
  	return SuiteReport;
  }();

  var focused = false;

  var moduleStack = [];

  function createModule(name, testEnvironment, modifiers) {
  	var parentModule = moduleStack.length ? moduleStack.slice(-1)[0] : null;
  	var moduleName = parentModule !== null ? [parentModule.name, name].join(" > ") : name;
  	var parentSuite = parentModule ? parentModule.suiteReport : globalSuite;

  	var skip = parentModule !== null && parentModule.skip || modifiers.skip;
  	var todo = parentModule !== null && parentModule.todo || modifiers.todo;

  	var module = {
  		name: moduleName,
  		parentModule: parentModule,
  		tests: [],
  		moduleId: generateHash(moduleName),
  		testsRun: 0,
  		unskippedTestsRun: 0,
  		childModules: [],
  		suiteReport: new SuiteReport(name, parentSuite),

  		// Pass along `skip` and `todo` properties from parent module, in case
  		// there is one, to childs. And use own otherwise.
  		// This property will be used to mark own tests and tests of child suites
  		// as either `skipped` or `todo`.
  		skip: skip,
  		todo: skip ? false : todo
  	};

  	var env = {};
  	if (parentModule) {
  		parentModule.childModules.push(module);
  		extend(env, parentModule.testEnvironment);
  	}
  	extend(env, testEnvironment);
  	module.testEnvironment = env;

  	config.modules.push(module);
  	return module;
  }

  function processModule(name, options, executeNow) {
  	var modifiers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  	if (objectType(options) === "function") {
  		executeNow = options;
  		options = undefined;
  	}

  	var module = createModule(name, options, modifiers);

  	// Move any hooks to a 'hooks' object
  	var testEnvironment = module.testEnvironment;
  	var hooks = module.hooks = {};

  	setHookFromEnvironment(hooks, testEnvironment, "before");
  	setHookFromEnvironment(hooks, testEnvironment, "beforeEach");
  	setHookFromEnvironment(hooks, testEnvironment, "afterEach");
  	setHookFromEnvironment(hooks, testEnvironment, "after");

  	var moduleFns = {
  		before: setHookFunction(module, "before"),
  		beforeEach: setHookFunction(module, "beforeEach"),
  		afterEach: setHookFunction(module, "afterEach"),
  		after: setHookFunction(module, "after")
  	};

  	var currentModule = config.currentModule;
  	if (objectType(executeNow) === "function") {
  		moduleStack.push(module);
  		config.currentModule = module;
  		executeNow.call(module.testEnvironment, moduleFns);
  		moduleStack.pop();
  		module = module.parentModule || currentModule;
  	}

  	config.currentModule = module;

  	function setHookFromEnvironment(hooks, environment, name) {
  		var potentialHook = environment[name];
  		hooks[name] = typeof potentialHook === "function" ? [potentialHook] : [];
  		delete environment[name];
  	}

  	function setHookFunction(module, hookName) {
  		return function setHook(callback) {
  			module.hooks[hookName].push(callback);
  		};
  	}
  }

  function module$1(name, options, executeNow) {
  	if (focused) {
  		return;
  	}

  	processModule(name, options, executeNow);
  }

  module$1.only = function () {
  	if (focused) {
  		return;
  	}

  	config.modules.length = 0;
  	config.queue.length = 0;

  	module$1.apply(undefined, arguments);

  	focused = true;
  };

  module$1.skip = function (name, options, executeNow) {
  	if (focused) {
  		return;
  	}

  	processModule(name, options, executeNow, { skip: true });
  };

  module$1.todo = function (name, options, executeNow) {
  	if (focused) {
  		return;
  	}

  	processModule(name, options, executeNow, { todo: true });
  };

  var LISTENERS = Object.create(null);
  var SUPPORTED_EVENTS = ["runStart", "suiteStart", "testStart", "assertion", "testEnd", "suiteEnd", "runEnd"];

  /**
   * Emits an event with the specified data to all currently registered listeners.
   * Callbacks will fire in the order in which they are registered (FIFO). This
   * function is not exposed publicly; it is used by QUnit internals to emit
   * logging events.
   *
   * @private
   * @method emit
   * @param {String} eventName
   * @param {Object} data
   * @return {Void}
   */
  function emit(eventName, data) {
  	if (objectType(eventName) !== "string") {
  		throw new TypeError("eventName must be a string when emitting an event");
  	}

  	// Clone the callbacks in case one of them registers a new callback
  	var originalCallbacks = LISTENERS[eventName];
  	var callbacks = originalCallbacks ? [].concat(toConsumableArray(originalCallbacks)) : [];

  	for (var i = 0; i < callbacks.length; i++) {
  		callbacks[i](data);
  	}
  }

  /**
   * Registers a callback as a listener to the specified event.
   *
   * @public
   * @method on
   * @param {String} eventName
   * @param {Function} callback
   * @return {Void}
   */
  function on(eventName, callback) {
  	if (objectType(eventName) !== "string") {
  		throw new TypeError("eventName must be a string when registering a listener");
  	} else if (!inArray(eventName, SUPPORTED_EVENTS)) {
  		var events = SUPPORTED_EVENTS.join(", ");
  		throw new Error("\"" + eventName + "\" is not a valid event; must be one of: " + events + ".");
  	} else if (objectType(callback) !== "function") {
  		throw new TypeError("callback must be a function when registering a listener");
  	}

  	if (!LISTENERS[eventName]) {
  		LISTENERS[eventName] = [];
  	}

  	// Don't register the same callback more than once
  	if (!inArray(callback, LISTENERS[eventName])) {
  		LISTENERS[eventName].push(callback);
  	}
  }

  // Register logging callbacks
  function registerLoggingCallbacks(obj) {
  	var i,
  	    l,
  	    key,
  	    callbackNames = ["begin", "done", "log", "testStart", "testDone", "moduleStart", "moduleDone"];

  	function registerLoggingCallback(key) {
  		var loggingCallback = function loggingCallback(callback) {
  			if (objectType(callback) !== "function") {
  				throw new Error("QUnit logging methods require a callback function as their first parameters.");
  			}

  			config.callbacks[key].push(callback);
  		};

  		return loggingCallback;
  	}

  	for (i = 0, l = callbackNames.length; i < l; i++) {
  		key = callbackNames[i];

  		// Initialize key collection of logging callback
  		if (objectType(config.callbacks[key]) === "undefined") {
  			config.callbacks[key] = [];
  		}

  		obj[key] = registerLoggingCallback(key);
  	}
  }

  function runLoggingCallbacks(key, args) {
  	var i, l, callbacks;

  	callbacks = config.callbacks[key];
  	for (i = 0, l = callbacks.length; i < l; i++) {
  		callbacks[i](args);
  	}
  }

  // Doesn't support IE9, it will return undefined on these browsers
  // See also https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error/Stack
  var fileName = (sourceFromStacktrace(0) || "").replace(/(:\d+)+\)?/, "").replace(/.+\//, "");

  function extractStacktrace(e, offset) {
  	offset = offset === undefined ? 4 : offset;

  	var stack, include, i;

  	if (e && e.stack) {
  		stack = e.stack.split("\n");
  		if (/^error$/i.test(stack[0])) {
  			stack.shift();
  		}
  		if (fileName) {
  			include = [];
  			for (i = offset; i < stack.length; i++) {
  				if (stack[i].indexOf(fileName) !== -1) {
  					break;
  				}
  				include.push(stack[i]);
  			}
  			if (include.length) {
  				return include.join("\n");
  			}
  		}
  		return stack[offset];
  	}
  }

  function sourceFromStacktrace(offset) {
  	var error = new Error();

  	// Support: Safari <=7 only, IE <=10 - 11 only
  	// Not all browsers generate the `stack` property for `new Error()`, see also #636
  	if (!error.stack) {
  		try {
  			throw error;
  		} catch (err) {
  			error = err;
  		}
  	}

  	return extractStacktrace(error, offset);
  }

  var priorityCount = 0;
  var unitSampler = void 0;

  // This is a queue of functions that are tasks within a single test.
  // After tests are dequeued from config.queue they are expanded into
  // a set of tasks in this queue.
  var taskQueue = [];

  /**
   * Advances the taskQueue to the next task. If the taskQueue is empty,
   * process the testQueue
   */
  function advance() {
  	advanceTaskQueue();

  	if (!taskQueue.length) {
  		advanceTestQueue();
  	}
  }

  /**
   * Advances the taskQueue to the next task if it is ready and not empty.
   */
  function advanceTaskQueue() {
  	var start = now();
  	config.depth = (config.depth || 0) + 1;

  	while (taskQueue.length && !config.blocking) {
  		var elapsedTime = now() - start;

  		if (!defined.setTimeout || config.updateRate <= 0 || elapsedTime < config.updateRate) {
  			var task = taskQueue.shift();
  			task();
  		} else {
  			setTimeout(advance);
  			break;
  		}
  	}

  	config.depth--;
  }

  /**
   * Advance the testQueue to the next test to process. Call done() if testQueue completes.
   */
  function advanceTestQueue() {
  	if (!config.blocking && !config.queue.length && config.depth === 0) {
  		done();
  		return;
  	}

  	var testTasks = config.queue.shift();
  	addToTaskQueue(testTasks());

  	if (priorityCount > 0) {
  		priorityCount--;
  	}

  	advance();
  }

  /**
   * Enqueue the tasks for a test into the task queue.
   * @param {Array} tasksArray
   */
  function addToTaskQueue(tasksArray) {
  	taskQueue.push.apply(taskQueue, toConsumableArray(tasksArray));
  }

  /**
   * Return the number of tasks remaining in the task queue to be processed.
   * @return {Number}
   */
  function taskQueueLength() {
  	return taskQueue.length;
  }

  /**
   * Adds a test to the TestQueue for execution.
   * @param {Function} testTasksFunc
   * @param {Boolean} prioritize
   * @param {String} seed
   */
  function addToTestQueue(testTasksFunc, prioritize, seed) {
  	if (prioritize) {
  		config.queue.splice(priorityCount++, 0, testTasksFunc);
  	} else if (seed) {
  		if (!unitSampler) {
  			unitSampler = unitSamplerGenerator(seed);
  		}

  		// Insert into a random position after all prioritized items
  		var index = Math.floor(unitSampler() * (config.queue.length - priorityCount + 1));
  		config.queue.splice(priorityCount + index, 0, testTasksFunc);
  	} else {
  		config.queue.push(testTasksFunc);
  	}
  }

  /**
   * Creates a seeded "sample" generator which is used for randomizing tests.
   */
  function unitSamplerGenerator(seed) {

  	// 32-bit xorshift, requires only a nonzero seed
  	// http://excamera.com/sphinx/article-xorshift.html
  	var sample = parseInt(generateHash(seed), 16) || -1;
  	return function () {
  		sample ^= sample << 13;
  		sample ^= sample >>> 17;
  		sample ^= sample << 5;

  		// ECMAScript has no unsigned number type
  		if (sample < 0) {
  			sample += 0x100000000;
  		}

  		return sample / 0x100000000;
  	};
  }

  /**
   * This function is called when the ProcessingQueue is done processing all
   * items. It handles emitting the final run events.
   */
  function done() {
  	var storage = config.storage;

  	ProcessingQueue.finished = true;

  	var runtime = now() - config.started;
  	var passed = config.stats.all - config.stats.bad;

  	if (config.stats.all === 0) {

  		if (config.filter && config.filter.length) {
  			throw new Error("No tests matched the filter \"" + config.filter + "\".");
  		}

  		if (config.module && config.module.length) {
  			throw new Error("No tests matched the module \"" + config.module + "\".");
  		}

  		if (config.moduleId && config.moduleId.length) {
  			throw new Error("No tests matched the moduleId \"" + config.moduleId + "\".");
  		}

  		if (config.testId && config.testId.length) {
  			throw new Error("No tests matched the testId \"" + config.testId + "\".");
  		}

  		throw new Error("No tests were run.");
  	}

  	emit("runEnd", globalSuite.end(true));
  	runLoggingCallbacks("done", {
  		passed: passed,
  		failed: config.stats.bad,
  		total: config.stats.all,
  		runtime: runtime
  	});

  	// Clear own storage items if all tests passed
  	if (storage && config.stats.bad === 0) {
  		for (var i = storage.length - 1; i >= 0; i--) {
  			var key = storage.key(i);

  			if (key.indexOf("qunit-test-") === 0) {
  				storage.removeItem(key);
  			}
  		}
  	}
  }

  var ProcessingQueue = {
  	finished: false,
  	add: addToTestQueue,
  	advance: advance,
  	taskCount: taskQueueLength
  };

  var TestReport = function () {
  	function TestReport(name, suite, options) {
  		classCallCheck(this, TestReport);

  		this.name = name;
  		this.suiteName = suite.name;
  		this.fullName = suite.fullName.concat(name);
  		this.runtime = 0;
  		this.assertions = [];

  		this.skipped = !!options.skip;
  		this.todo = !!options.todo;

  		this.valid = options.valid;

  		this._startTime = 0;
  		this._endTime = 0;

  		suite.pushTest(this);
  	}

  	createClass(TestReport, [{
  		key: "start",
  		value: function start(recordTime) {
  			if (recordTime) {
  				this._startTime = Date.now();
  			}

  			return {
  				name: this.name,
  				suiteName: this.suiteName,
  				fullName: this.fullName.slice()
  			};
  		}
  	}, {
  		key: "end",
  		value: function end(recordTime) {
  			if (recordTime) {
  				this._endTime = Date.now();
  			}

  			return extend(this.start(), {
  				runtime: this.getRuntime(),
  				status: this.getStatus(),
  				errors: this.getFailedAssertions(),
  				assertions: this.getAssertions()
  			});
  		}
  	}, {
  		key: "pushAssertion",
  		value: function pushAssertion(assertion) {
  			this.assertions.push(assertion);
  		}
  	}, {
  		key: "getRuntime",
  		value: function getRuntime() {
  			return this._endTime - this._startTime;
  		}
  	}, {
  		key: "getStatus",
  		value: function getStatus() {
  			if (this.skipped) {
  				return "skipped";
  			}

  			var testPassed = this.getFailedAssertions().length > 0 ? this.todo : !this.todo;

  			if (!testPassed) {
  				return "failed";
  			} else if (this.todo) {
  				return "todo";
  			} else {
  				return "passed";
  			}
  		}
  	}, {
  		key: "getFailedAssertions",
  		value: function getFailedAssertions() {
  			return this.assertions.filter(function (assertion) {
  				return !assertion.passed;
  			});
  		}
  	}, {
  		key: "getAssertions",
  		value: function getAssertions() {
  			return this.assertions.slice();
  		}

  		// Remove actual and expected values from assertions. This is to prevent
  		// leaking memory throughout a test suite.

  	}, {
  		key: "slimAssertions",
  		value: function slimAssertions() {
  			this.assertions = this.assertions.map(function (assertion) {
  				delete assertion.actual;
  				delete assertion.expected;
  				return assertion;
  			});
  		}
  	}]);
  	return TestReport;
  }();

  var focused$1 = false;

  function Test(settings) {
  	var i, l;

  	++Test.count;

  	this.expected = null;
  	this.assertions = [];
  	this.semaphore = 0;
  	this.module = config.currentModule;
  	this.stack = sourceFromStacktrace(3);
  	this.steps = [];
  	this.timeout = undefined;

  	// If a module is skipped, all its tests and the tests of the child suites
  	// should be treated as skipped even if they are defined as `only` or `todo`.
  	// As for `todo` module, all its tests will be treated as `todo` except for
  	// tests defined as `skip` which will be left intact.
  	//
  	// So, if a test is defined as `todo` and is inside a skipped module, we should
  	// then treat that test as if was defined as `skip`.
  	if (this.module.skip) {
  		settings.skip = true;
  		settings.todo = false;

  		// Skipped tests should be left intact
  	} else if (this.module.todo && !settings.skip) {
  		settings.todo = true;
  	}

  	extend(this, settings);

  	this.testReport = new TestReport(settings.testName, this.module.suiteReport, {
  		todo: settings.todo,
  		skip: settings.skip,
  		valid: this.valid()
  	});

  	// Register unique strings
  	for (i = 0, l = this.module.tests; i < l.length; i++) {
  		if (this.module.tests[i].name === this.testName) {
  			this.testName += " ";
  		}
  	}

  	this.testId = generateHash(this.module.name, this.testName);

  	this.module.tests.push({
  		name: this.testName,
  		testId: this.testId,
  		skip: !!settings.skip
  	});

  	if (settings.skip) {

  		// Skipped tests will fully ignore any sent callback
  		this.callback = function () {};
  		this.async = false;
  		this.expected = 0;
  	} else {
  		if (typeof this.callback !== "function") {
  			var method = this.todo ? "todo" : "test";

  			// eslint-disable-next-line max-len
  			throw new TypeError("You must provide a function as a test callback to QUnit." + method + "(\"" + settings.testName + "\")");
  		}

  		this.assert = new Assert(this);
  	}
  }

  Test.count = 0;

  function getNotStartedModules(startModule) {
  	var module = startModule,
  	    modules = [];

  	while (module && module.testsRun === 0) {
  		modules.push(module);
  		module = module.parentModule;
  	}

  	return modules;
  }

  Test.prototype = {
  	before: function before() {
  		var i,
  		    startModule,
  		    module = this.module,
  		    notStartedModules = getNotStartedModules(module);

  		for (i = notStartedModules.length - 1; i >= 0; i--) {
  			startModule = notStartedModules[i];
  			startModule.stats = { all: 0, bad: 0, started: now() };
  			emit("suiteStart", startModule.suiteReport.start(true));
  			runLoggingCallbacks("moduleStart", {
  				name: startModule.name,
  				tests: startModule.tests
  			});
  		}

  		config.current = this;

  		this.testEnvironment = extend({}, module.testEnvironment);

  		this.started = now();
  		emit("testStart", this.testReport.start(true));
  		runLoggingCallbacks("testStart", {
  			name: this.testName,
  			module: module.name,
  			testId: this.testId,
  			previousFailure: this.previousFailure
  		});

  		if (!config.pollution) {
  			saveGlobal();
  		}
  	},

  	run: function run() {
  		var promise;

  		config.current = this;

  		this.callbackStarted = now();

  		if (config.notrycatch) {
  			runTest(this);
  			return;
  		}

  		try {
  			runTest(this);
  		} catch (e) {
  			this.pushFailure("Died on test #" + (this.assertions.length + 1) + " " + this.stack + ": " + (e.message || e), extractStacktrace(e, 0));

  			// Else next test will carry the responsibility
  			saveGlobal();

  			// Restart the tests if they're blocking
  			if (config.blocking) {
  				internalRecover(this);
  			}
  		}

  		function runTest(test) {
  			promise = test.callback.call(test.testEnvironment, test.assert);
  			test.resolvePromise(promise);

  			// If the test has a "lock" on it, but the timeout is 0, then we push a
  			// failure as the test should be synchronous.
  			if (test.timeout === 0 && test.semaphore !== 0) {
  				pushFailure("Test did not finish synchronously even though assert.timeout( 0 ) was used.", sourceFromStacktrace(2));
  			}
  		}
  	},

  	after: function after() {
  		checkPollution();
  	},

  	queueHook: function queueHook(hook, hookName, hookOwner) {
  		var _this = this;

  		var callHook = function callHook() {
  			var promise = hook.call(_this.testEnvironment, _this.assert);
  			_this.resolvePromise(promise, hookName);
  		};

  		var runHook = function runHook() {
  			if (hookName === "before") {
  				if (hookOwner.unskippedTestsRun !== 0) {
  					return;
  				}

  				_this.preserveEnvironment = true;
  			}

  			// The 'after' hook should only execute when there are not tests left and
  			// when the 'after' and 'finish' tasks are the only tasks left to process
  			if (hookName === "after" && hookOwner.unskippedTestsRun !== numberOfUnskippedTests(hookOwner) - 1 && (config.queue.length > 0 || ProcessingQueue.taskCount() > 2)) {
  				return;
  			}

  			config.current = _this;
  			if (config.notrycatch) {
  				callHook();
  				return;
  			}
  			try {
  				callHook();
  			} catch (error) {
  				_this.pushFailure(hookName + " failed on " + _this.testName + ": " + (error.message || error), extractStacktrace(error, 0));
  			}
  		};

  		return runHook;
  	},


  	// Currently only used for module level hooks, can be used to add global level ones
  	hooks: function hooks(handler) {
  		var hooks = [];

  		function processHooks(test, module) {
  			if (module.parentModule) {
  				processHooks(test, module.parentModule);
  			}

  			if (module.hooks[handler].length) {
  				for (var i = 0; i < module.hooks[handler].length; i++) {
  					hooks.push(test.queueHook(module.hooks[handler][i], handler, module));
  				}
  			}
  		}

  		// Hooks are ignored on skipped tests
  		if (!this.skip) {
  			processHooks(this, this.module);
  		}

  		return hooks;
  	},


  	finish: function finish() {
  		config.current = this;

  		// Release the test callback to ensure that anything referenced has been
  		// released to be garbage collected.
  		this.callback = undefined;

  		if (this.steps.length) {
  			var stepsList = this.steps.join(", ");
  			this.pushFailure("Expected assert.verifySteps() to be called before end of test " + ("after using assert.step(). Unverified steps: " + stepsList), this.stack);
  		}

  		if (config.requireExpects && this.expected === null) {
  			this.pushFailure("Expected number of assertions to be defined, but expect() was " + "not called.", this.stack);
  		} else if (this.expected !== null && this.expected !== this.assertions.length) {
  			this.pushFailure("Expected " + this.expected + " assertions, but " + this.assertions.length + " were run", this.stack);
  		} else if (this.expected === null && !this.assertions.length) {
  			this.pushFailure("Expected at least one assertion, but none were run - call " + "expect(0) to accept zero assertions.", this.stack);
  		}

  		var i,
  		    module = this.module,
  		    moduleName = module.name,
  		    testName = this.testName,
  		    skipped = !!this.skip,
  		    todo = !!this.todo,
  		    bad = 0,
  		    storage = config.storage;

  		this.runtime = now() - this.started;

  		config.stats.all += this.assertions.length;
  		module.stats.all += this.assertions.length;

  		for (i = 0; i < this.assertions.length; i++) {
  			if (!this.assertions[i].result) {
  				bad++;
  				config.stats.bad++;
  				module.stats.bad++;
  			}
  		}

  		notifyTestsRan(module, skipped);

  		// Store result when possible
  		if (storage) {
  			if (bad) {
  				storage.setItem("qunit-test-" + moduleName + "-" + testName, bad);
  			} else {
  				storage.removeItem("qunit-test-" + moduleName + "-" + testName);
  			}
  		}

  		// After emitting the js-reporters event we cleanup the assertion data to
  		// avoid leaking it. It is not used by the legacy testDone callbacks.
  		emit("testEnd", this.testReport.end(true));
  		this.testReport.slimAssertions();

  		runLoggingCallbacks("testDone", {
  			name: testName,
  			module: moduleName,
  			skipped: skipped,
  			todo: todo,
  			failed: bad,
  			passed: this.assertions.length - bad,
  			total: this.assertions.length,
  			runtime: skipped ? 0 : this.runtime,

  			// HTML Reporter use
  			assertions: this.assertions,
  			testId: this.testId,

  			// Source of Test
  			source: this.stack
  		});

  		if (module.testsRun === numberOfTests(module)) {
  			logSuiteEnd(module);

  			// Check if the parent modules, iteratively, are done. If that the case,
  			// we emit the `suiteEnd` event and trigger `moduleDone` callback.
  			var parent = module.parentModule;
  			while (parent && parent.testsRun === numberOfTests(parent)) {
  				logSuiteEnd(parent);
  				parent = parent.parentModule;
  			}
  		}

  		config.current = undefined;

  		function logSuiteEnd(module) {

  			// Reset `module.hooks` to ensure that anything referenced in these hooks
  			// has been released to be garbage collected.
  			module.hooks = {};

  			emit("suiteEnd", module.suiteReport.end(true));
  			runLoggingCallbacks("moduleDone", {
  				name: module.name,
  				tests: module.tests,
  				failed: module.stats.bad,
  				passed: module.stats.all - module.stats.bad,
  				total: module.stats.all,
  				runtime: now() - module.stats.started
  			});
  		}
  	},

  	preserveTestEnvironment: function preserveTestEnvironment() {
  		if (this.preserveEnvironment) {
  			this.module.testEnvironment = this.testEnvironment;
  			this.testEnvironment = extend({}, this.module.testEnvironment);
  		}
  	},

  	queue: function queue() {
  		var test = this;

  		if (!this.valid()) {
  			return;
  		}

  		function runTest() {
  			return [function () {
  				test.before();
  			}].concat(toConsumableArray(test.hooks("before")), [function () {
  				test.preserveTestEnvironment();
  			}], toConsumableArray(test.hooks("beforeEach")), [function () {
  				test.run();
  			}], toConsumableArray(test.hooks("afterEach").reverse()), toConsumableArray(test.hooks("after").reverse()), [function () {
  				test.after();
  			}, function () {
  				test.finish();
  			}]);
  		}

  		var previousFailCount = config.storage && +config.storage.getItem("qunit-test-" + this.module.name + "-" + this.testName);

  		// Prioritize previously failed tests, detected from storage
  		var prioritize = config.reorder && !!previousFailCount;

  		this.previousFailure = !!previousFailCount;

  		ProcessingQueue.add(runTest, prioritize, config.seed);

  		// If the queue has already finished, we manually process the new test
  		if (ProcessingQueue.finished) {
  			ProcessingQueue.advance();
  		}
  	},


  	pushResult: function pushResult(resultInfo) {
  		if (this !== config.current) {
  			throw new Error("Assertion occurred after test had finished.");
  		}

  		// Destructure of resultInfo = { result, actual, expected, message, negative }
  		var source,
  		    details = {
  			module: this.module.name,
  			name: this.testName,
  			result: resultInfo.result,
  			message: resultInfo.message,
  			actual: resultInfo.actual,
  			testId: this.testId,
  			negative: resultInfo.negative || false,
  			runtime: now() - this.started,
  			todo: !!this.todo
  		};

  		if (hasOwn.call(resultInfo, "expected")) {
  			details.expected = resultInfo.expected;
  		}

  		if (!resultInfo.result) {
  			source = resultInfo.source || sourceFromStacktrace();

  			if (source) {
  				details.source = source;
  			}
  		}

  		this.logAssertion(details);

  		this.assertions.push({
  			result: !!resultInfo.result,
  			message: resultInfo.message
  		});
  	},

  	pushFailure: function pushFailure(message, source, actual) {
  		if (!(this instanceof Test)) {
  			throw new Error("pushFailure() assertion outside test context, was " + sourceFromStacktrace(2));
  		}

  		this.pushResult({
  			result: false,
  			message: message || "error",
  			actual: actual || null,
  			source: source
  		});
  	},

  	/**
    * Log assertion details using both the old QUnit.log interface and
    * QUnit.on( "assertion" ) interface.
    *
    * @private
    */
  	logAssertion: function logAssertion(details) {
  		runLoggingCallbacks("log", details);

  		var assertion = {
  			passed: details.result,
  			actual: details.actual,
  			expected: details.expected,
  			message: details.message,
  			stack: details.source,
  			todo: details.todo
  		};
  		this.testReport.pushAssertion(assertion);
  		emit("assertion", assertion);
  	},


  	resolvePromise: function resolvePromise(promise, phase) {
  		var then,
  		    resume,
  		    message,
  		    test = this;
  		if (promise != null) {
  			then = promise.then;
  			if (objectType(then) === "function") {
  				resume = internalStop(test);
  				if (config.notrycatch) {
  					then.call(promise, function () {
  						resume();
  					});
  				} else {
  					then.call(promise, function () {
  						resume();
  					}, function (error) {
  						message = "Promise rejected " + (!phase ? "during" : phase.replace(/Each$/, "")) + " \"" + test.testName + "\": " + (error && error.message || error);
  						test.pushFailure(message, extractStacktrace(error, 0));

  						// Else next test will carry the responsibility
  						saveGlobal();

  						// Unblock
  						internalRecover(test);
  					});
  				}
  			}
  		}
  	},

  	valid: function valid() {
  		var filter = config.filter,
  		    regexFilter = /^(!?)\/([\w\W]*)\/(i?$)/.exec(filter),
  		    module = config.module && config.module.toLowerCase(),
  		    fullName = this.module.name + ": " + this.testName;

  		function moduleChainNameMatch(testModule) {
  			var testModuleName = testModule.name ? testModule.name.toLowerCase() : null;
  			if (testModuleName === module) {
  				return true;
  			} else if (testModule.parentModule) {
  				return moduleChainNameMatch(testModule.parentModule);
  			} else {
  				return false;
  			}
  		}

  		function moduleChainIdMatch(testModule) {
  			return inArray(testModule.moduleId, config.moduleId) || testModule.parentModule && moduleChainIdMatch(testModule.parentModule);
  		}

  		// Internally-generated tests are always valid
  		if (this.callback && this.callback.validTest) {
  			return true;
  		}

  		if (config.moduleId && config.moduleId.length > 0 && !moduleChainIdMatch(this.module)) {

  			return false;
  		}

  		if (config.testId && config.testId.length > 0 && !inArray(this.testId, config.testId)) {

  			return false;
  		}

  		if (module && !moduleChainNameMatch(this.module)) {
  			return false;
  		}

  		if (!filter) {
  			return true;
  		}

  		return regexFilter ? this.regexFilter(!!regexFilter[1], regexFilter[2], regexFilter[3], fullName) : this.stringFilter(filter, fullName);
  	},

  	regexFilter: function regexFilter(exclude, pattern, flags, fullName) {
  		var regex = new RegExp(pattern, flags);
  		var match = regex.test(fullName);

  		return match !== exclude;
  	},

  	stringFilter: function stringFilter(filter, fullName) {
  		filter = filter.toLowerCase();
  		fullName = fullName.toLowerCase();

  		var include = filter.charAt(0) !== "!";
  		if (!include) {
  			filter = filter.slice(1);
  		}

  		// If the filter matches, we need to honour include
  		if (fullName.indexOf(filter) !== -1) {
  			return include;
  		}

  		// Otherwise, do the opposite
  		return !include;
  	}
  };

  function pushFailure() {
  	if (!config.current) {
  		throw new Error("pushFailure() assertion outside test context, in " + sourceFromStacktrace(2));
  	}

  	// Gets current test obj
  	var currentTest = config.current;

  	return currentTest.pushFailure.apply(currentTest, arguments);
  }

  function saveGlobal() {
  	config.pollution = [];

  	if (config.noglobals) {
  		for (var key in global$1) {
  			if (hasOwn.call(global$1, key)) {

  				// In Opera sometimes DOM element ids show up here, ignore them
  				if (/^qunit-test-output/.test(key)) {
  					continue;
  				}
  				config.pollution.push(key);
  			}
  		}
  	}
  }

  function checkPollution() {
  	var newGlobals,
  	    deletedGlobals,
  	    old = config.pollution;

  	saveGlobal();

  	newGlobals = diff(config.pollution, old);
  	if (newGlobals.length > 0) {
  		pushFailure("Introduced global variable(s): " + newGlobals.join(", "));
  	}

  	deletedGlobals = diff(old, config.pollution);
  	if (deletedGlobals.length > 0) {
  		pushFailure("Deleted global variable(s): " + deletedGlobals.join(", "));
  	}
  }

  // Will be exposed as QUnit.test
  function test(testName, callback) {
  	if (focused$1) {
  		return;
  	}

  	var newTest = new Test({
  		testName: testName,
  		callback: callback
  	});

  	newTest.queue();
  }

  function todo(testName, callback) {
  	if (focused$1) {
  		return;
  	}

  	var newTest = new Test({
  		testName: testName,
  		callback: callback,
  		todo: true
  	});

  	newTest.queue();
  }

  // Will be exposed as QUnit.skip
  function skip(testName) {
  	if (focused$1) {
  		return;
  	}

  	var test = new Test({
  		testName: testName,
  		skip: true
  	});

  	test.queue();
  }

  // Will be exposed as QUnit.only
  function only(testName, callback) {
  	if (focused$1) {
  		return;
  	}

  	config.queue.length = 0;
  	focused$1 = true;

  	var newTest = new Test({
  		testName: testName,
  		callback: callback
  	});

  	newTest.queue();
  }

  // Put a hold on processing and return a function that will release it.
  function internalStop(test) {
  	test.semaphore += 1;
  	config.blocking = true;

  	// Set a recovery timeout, if so configured.
  	if (defined.setTimeout) {
  		var timeoutDuration = void 0;

  		if (typeof test.timeout === "number") {
  			timeoutDuration = test.timeout;
  		} else if (typeof config.testTimeout === "number") {
  			timeoutDuration = config.testTimeout;
  		}

  		if (typeof timeoutDuration === "number" && timeoutDuration > 0) {
  			clearTimeout(config.timeout);
  			config.timeout = setTimeout(function () {
  				pushFailure("Test took longer than " + timeoutDuration + "ms; test timed out.", sourceFromStacktrace(2));
  				internalRecover(test);
  			}, timeoutDuration);
  		}
  	}

  	var released = false;
  	return function resume() {
  		if (released) {
  			return;
  		}

  		released = true;
  		test.semaphore -= 1;
  		internalStart(test);
  	};
  }

  // Forcefully release all processing holds.
  function internalRecover(test) {
  	test.semaphore = 0;
  	internalStart(test);
  }

  // Release a processing hold, scheduling a resumption attempt if no holds remain.
  function internalStart(test) {

  	// If semaphore is non-numeric, throw error
  	if (isNaN(test.semaphore)) {
  		test.semaphore = 0;

  		pushFailure("Invalid value on test.semaphore", sourceFromStacktrace(2));
  		return;
  	}

  	// Don't start until equal number of stop-calls
  	if (test.semaphore > 0) {
  		return;
  	}

  	// Throw an Error if start is called more often than stop
  	if (test.semaphore < 0) {
  		test.semaphore = 0;

  		pushFailure("Tried to restart test while already started (test's semaphore was 0 already)", sourceFromStacktrace(2));
  		return;
  	}

  	// Add a slight delay to allow more assertions etc.
  	if (defined.setTimeout) {
  		if (config.timeout) {
  			clearTimeout(config.timeout);
  		}
  		config.timeout = setTimeout(function () {
  			if (test.semaphore > 0) {
  				return;
  			}

  			if (config.timeout) {
  				clearTimeout(config.timeout);
  			}

  			begin();
  		});
  	} else {
  		begin();
  	}
  }

  function collectTests(module) {
  	var tests = [].concat(module.tests);
  	var modules = [].concat(toConsumableArray(module.childModules));

  	// Do a breadth-first traversal of the child modules
  	while (modules.length) {
  		var nextModule = modules.shift();
  		tests.push.apply(tests, nextModule.tests);
  		modules.push.apply(modules, toConsumableArray(nextModule.childModules));
  	}

  	return tests;
  }

  function numberOfTests(module) {
  	return collectTests(module).length;
  }

  function numberOfUnskippedTests(module) {
  	return collectTests(module).filter(function (test) {
  		return !test.skip;
  	}).length;
  }

  function notifyTestsRan(module, skipped) {
  	module.testsRun++;
  	if (!skipped) {
  		module.unskippedTestsRun++;
  	}
  	while (module = module.parentModule) {
  		module.testsRun++;
  		if (!skipped) {
  			module.unskippedTestsRun++;
  		}
  	}
  }

  /**
   * Returns a function that proxies to the given method name on the globals
   * console object. The proxy will also detect if the console doesn't exist and
   * will appropriately no-op. This allows support for IE9, which doesn't have a
   * console if the developer tools are not open.
   */
  function consoleProxy(method) {
  	return function () {
  		if (console) {
  			console[method].apply(console, arguments);
  		}
  	};
  }

  var Logger = {
  	warn: consoleProxy("warn")
  };

  var Assert = function () {
  	function Assert(testContext) {
  		classCallCheck(this, Assert);

  		this.test = testContext;
  	}

  	// Assert helpers

  	createClass(Assert, [{
  		key: "timeout",
  		value: function timeout(duration) {
  			if (typeof duration !== "number") {
  				throw new Error("You must pass a number as the duration to assert.timeout");
  			}

  			this.test.timeout = duration;
  		}

  		// Documents a "step", which is a string value, in a test as a passing assertion

  	}, {
  		key: "step",
  		value: function step(message) {
  			var assertionMessage = message;
  			var result = !!message;

  			this.test.steps.push(message);

  			if (objectType(message) === "undefined" || message === "") {
  				assertionMessage = "You must provide a message to assert.step";
  			} else if (objectType(message) !== "string") {
  				assertionMessage = "You must provide a string value to assert.step";
  				result = false;
  			}

  			this.pushResult({
  				result: result,
  				message: assertionMessage
  			});
  		}

  		// Verifies the steps in a test match a given array of string values

  	}, {
  		key: "verifySteps",
  		value: function verifySteps(steps, message) {

  			// Since the steps array is just string values, we can clone with slice
  			var actualStepsClone = this.test.steps.slice();
  			this.deepEqual(actualStepsClone, steps, message);
  			this.test.steps.length = 0;
  		}

  		// Specify the number of expected assertions to guarantee that failed test
  		// (no assertions are run at all) don't slip through.

  	}, {
  		key: "expect",
  		value: function expect(asserts) {
  			if (arguments.length === 1) {
  				this.test.expected = asserts;
  			} else {
  				return this.test.expected;
  			}
  		}

  		// Put a hold on processing and return a function that will release it a maximum of once.

  	}, {
  		key: "async",
  		value: function async(count) {
  			var test$$1 = this.test;

  			var popped = false,
  			    acceptCallCount = count;

  			if (typeof acceptCallCount === "undefined") {
  				acceptCallCount = 1;
  			}

  			var resume = internalStop(test$$1);

  			return function done() {
  				if (config.current !== test$$1) {
  					throw Error("assert.async callback called after test finished.");
  				}

  				if (popped) {
  					test$$1.pushFailure("Too many calls to the `assert.async` callback", sourceFromStacktrace(2));
  					return;
  				}

  				acceptCallCount -= 1;
  				if (acceptCallCount > 0) {
  					return;
  				}

  				popped = true;
  				resume();
  			};
  		}

  		// Exports test.push() to the user API
  		// Alias of pushResult.

  	}, {
  		key: "push",
  		value: function push(result, actual, expected, message, negative) {
  			Logger.warn("assert.push is deprecated and will be removed in QUnit 3.0." + " Please use assert.pushResult instead (https://api.qunitjs.com/assert/pushResult).");

  			var currentAssert = this instanceof Assert ? this : config.current.assert;
  			return currentAssert.pushResult({
  				result: result,
  				actual: actual,
  				expected: expected,
  				message: message,
  				negative: negative
  			});
  		}
  	}, {
  		key: "pushResult",
  		value: function pushResult(resultInfo) {

  			// Destructure of resultInfo = { result, actual, expected, message, negative }
  			var assert = this;
  			var currentTest = assert instanceof Assert && assert.test || config.current;

  			// Backwards compatibility fix.
  			// Allows the direct use of global exported assertions and QUnit.assert.*
  			// Although, it's use is not recommended as it can leak assertions
  			// to other tests from async tests, because we only get a reference to the current test,
  			// not exactly the test where assertion were intended to be called.
  			if (!currentTest) {
  				throw new Error("assertion outside test context, in " + sourceFromStacktrace(2));
  			}

  			if (!(assert instanceof Assert)) {
  				assert = currentTest.assert;
  			}

  			return assert.test.pushResult(resultInfo);
  		}
  	}, {
  		key: "ok",
  		value: function ok(result, message) {
  			if (!message) {
  				message = result ? "okay" : "failed, expected argument to be truthy, was: " + dump.parse(result);
  			}

  			this.pushResult({
  				result: !!result,
  				actual: result,
  				expected: true,
  				message: message
  			});
  		}
  	}, {
  		key: "notOk",
  		value: function notOk(result, message) {
  			if (!message) {
  				message = !result ? "okay" : "failed, expected argument to be falsy, was: " + dump.parse(result);
  			}

  			this.pushResult({
  				result: !result,
  				actual: result,
  				expected: false,
  				message: message
  			});
  		}
  	}, {
  		key: "equal",
  		value: function equal(actual, expected, message) {

  			// eslint-disable-next-line eqeqeq
  			var result = expected == actual;

  			this.pushResult({
  				result: result,
  				actual: actual,
  				expected: expected,
  				message: message
  			});
  		}
  	}, {
  		key: "notEqual",
  		value: function notEqual(actual, expected, message) {

  			// eslint-disable-next-line eqeqeq
  			var result = expected != actual;

  			this.pushResult({
  				result: result,
  				actual: actual,
  				expected: expected,
  				message: message,
  				negative: true
  			});
  		}
  	}, {
  		key: "propEqual",
  		value: function propEqual(actual, expected, message) {
  			actual = objectValues(actual);
  			expected = objectValues(expected);

  			this.pushResult({
  				result: equiv(actual, expected),
  				actual: actual,
  				expected: expected,
  				message: message
  			});
  		}
  	}, {
  		key: "notPropEqual",
  		value: function notPropEqual(actual, expected, message) {
  			actual = objectValues(actual);
  			expected = objectValues(expected);

  			this.pushResult({
  				result: !equiv(actual, expected),
  				actual: actual,
  				expected: expected,
  				message: message,
  				negative: true
  			});
  		}
  	}, {
  		key: "deepEqual",
  		value: function deepEqual(actual, expected, message) {
  			this.pushResult({
  				result: equiv(actual, expected),
  				actual: actual,
  				expected: expected,
  				message: message
  			});
  		}
  	}, {
  		key: "notDeepEqual",
  		value: function notDeepEqual(actual, expected, message) {
  			this.pushResult({
  				result: !equiv(actual, expected),
  				actual: actual,
  				expected: expected,
  				message: message,
  				negative: true
  			});
  		}
  	}, {
  		key: "strictEqual",
  		value: function strictEqual(actual, expected, message) {
  			this.pushResult({
  				result: expected === actual,
  				actual: actual,
  				expected: expected,
  				message: message
  			});
  		}
  	}, {
  		key: "notStrictEqual",
  		value: function notStrictEqual(actual, expected, message) {
  			this.pushResult({
  				result: expected !== actual,
  				actual: actual,
  				expected: expected,
  				message: message,
  				negative: true
  			});
  		}
  	}, {
  		key: "throws",
  		value: function throws(block, expected, message) {
  			var actual = void 0,
  			    result = false;

  			var currentTest = this instanceof Assert && this.test || config.current;

  			// 'expected' is optional unless doing string comparison
  			if (objectType(expected) === "string") {
  				if (message == null) {
  					message = expected;
  					expected = null;
  				} else {
  					throw new Error("throws/raises does not accept a string value for the expected argument.\n" + "Use a non-string object value (e.g. regExp) instead if it's necessary.");
  				}
  			}

  			currentTest.ignoreGlobalErrors = true;
  			try {
  				block.call(currentTest.testEnvironment);
  			} catch (e) {
  				actual = e;
  			}
  			currentTest.ignoreGlobalErrors = false;

  			if (actual) {
  				var expectedType = objectType(expected);

  				// We don't want to validate thrown error
  				if (!expected) {
  					result = true;
  					expected = null;

  					// Expected is a regexp
  				} else if (expectedType === "regexp") {
  					result = expected.test(errorString(actual));

  					// Expected is a constructor, maybe an Error constructor
  				} else if (expectedType === "function" && actual instanceof expected) {
  					result = true;

  					// Expected is an Error object
  				} else if (expectedType === "object") {
  					result = actual instanceof expected.constructor && actual.name === expected.name && actual.message === expected.message;

  					// Expected is a validation function which returns true if validation passed
  				} else if (expectedType === "function" && expected.call({}, actual) === true) {
  					expected = null;
  					result = true;
  				}
  			}

  			currentTest.assert.pushResult({
  				result: result,
  				actual: actual,
  				expected: expected,
  				message: message
  			});
  		}
  	}, {
  		key: "rejects",
  		value: function rejects(promise, expected, message) {
  			var result = false;

  			var currentTest = this instanceof Assert && this.test || config.current;

  			// 'expected' is optional unless doing string comparison
  			if (objectType(expected) === "string") {
  				if (message === undefined) {
  					message = expected;
  					expected = undefined;
  				} else {
  					message = "assert.rejects does not accept a string value for the expected " + "argument.\nUse a non-string object value (e.g. validator function) instead " + "if necessary.";

  					currentTest.assert.pushResult({
  						result: false,
  						message: message
  					});

  					return;
  				}
  			}

  			var then = promise && promise.then;
  			if (objectType(then) !== "function") {
  				var _message = "The value provided to `assert.rejects` in " + "\"" + currentTest.testName + "\" was not a promise.";

  				currentTest.assert.pushResult({
  					result: false,
  					message: _message,
  					actual: promise
  				});

  				return;
  			}

  			var done = this.async();

  			return then.call(promise, function handleFulfillment() {
  				var message = "The promise returned by the `assert.rejects` callback in " + "\"" + currentTest.testName + "\" did not reject.";

  				currentTest.assert.pushResult({
  					result: false,
  					message: message,
  					actual: promise
  				});

  				done();
  			}, function handleRejection(actual) {
  				var expectedType = objectType(expected);

  				// We don't want to validate
  				if (expected === undefined) {
  					result = true;
  					expected = actual;

  					// Expected is a regexp
  				} else if (expectedType === "regexp") {
  					result = expected.test(errorString(actual));

  					// Expected is a constructor, maybe an Error constructor
  				} else if (expectedType === "function" && actual instanceof expected) {
  					result = true;

  					// Expected is an Error object
  				} else if (expectedType === "object") {
  					result = actual instanceof expected.constructor && actual.name === expected.name && actual.message === expected.message;

  					// Expected is a validation function which returns true if validation passed
  				} else {
  					if (expectedType === "function") {
  						result = expected.call({}, actual) === true;
  						expected = null;

  						// Expected is some other invalid type
  					} else {
  						result = false;
  						message = "invalid expected value provided to `assert.rejects` " + "callback in \"" + currentTest.testName + "\": " + expectedType + ".";
  					}
  				}

  				currentTest.assert.pushResult({
  					result: result,
  					actual: actual,
  					expected: expected,
  					message: message
  				});

  				done();
  			});
  		}
  	}]);
  	return Assert;
  }();

  // Provide an alternative to assert.throws(), for environments that consider throws a reserved word
  // Known to us are: Closure Compiler, Narwhal
  // eslint-disable-next-line dot-notation


  Assert.prototype.raises = Assert.prototype["throws"];

  /**
   * Converts an error into a simple string for comparisons.
   *
   * @param {Error} error
   * @return {String}
   */
  function errorString(error) {
  	var resultErrorString = error.toString();

  	if (resultErrorString.substring(0, 7) === "[object") {
  		var name = error.name ? error.name.toString() : "Error";
  		var message = error.message ? error.message.toString() : "";

  		if (name && message) {
  			return name + ": " + message;
  		} else if (name) {
  			return name;
  		} else if (message) {
  			return message;
  		} else {
  			return "Error";
  		}
  	} else {
  		return resultErrorString;
  	}
  }

  /* global module, exports, define */
  function exportQUnit(QUnit) {

  	if (defined.document) {

  		// QUnit may be defined when it is preconfigured but then only QUnit and QUnit.config may be defined.
  		if (window.QUnit && window.QUnit.version) {
  			throw new Error("QUnit has already been defined.");
  		}

  		window.QUnit = QUnit;
  	}

  	// For nodejs
  	if (typeof module !== "undefined" && module && module.exports) {
  		module.exports = QUnit;

  		// For consistency with CommonJS environments' exports
  		module.exports.QUnit = QUnit;
  	}

  	// For CommonJS with exports, but without module.exports, like Rhino
  	if (typeof exports !== "undefined" && exports) {
  		exports.QUnit = QUnit;
  	}

  	if (typeof define === "function" && define.amd) {
  		define(function () {
  			return QUnit;
  		});
  		QUnit.config.autostart = false;
  	}

  	// For Web/Service Workers
  	if (self$1 && self$1.WorkerGlobalScope && self$1 instanceof self$1.WorkerGlobalScope) {
  		self$1.QUnit = QUnit;
  	}
  }

  // Handle an unhandled exception. By convention, returns true if further
  // error handling should be suppressed and false otherwise.
  // In this case, we will only suppress further error handling if the
  // "ignoreGlobalErrors" configuration option is enabled.
  function onError(error) {
  	for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
  		args[_key - 1] = arguments[_key];
  	}

  	if (config.current) {
  		if (config.current.ignoreGlobalErrors) {
  			return true;
  		}
  		pushFailure.apply(undefined, [error.message, error.fileName + ":" + error.lineNumber].concat(args));
  	} else {
  		test("global failure", extend(function () {
  			pushFailure.apply(undefined, [error.message, error.fileName + ":" + error.lineNumber].concat(args));
  		}, { validTest: true }));
  	}

  	return false;
  }

  // Handle an unhandled rejection
  function onUnhandledRejection(reason) {
  	var resultInfo = {
  		result: false,
  		message: reason.message || "error",
  		actual: reason,
  		source: reason.stack || sourceFromStacktrace(3)
  	};

  	var currentTest = config.current;
  	if (currentTest) {
  		currentTest.assert.pushResult(resultInfo);
  	} else {
  		test("global failure", extend(function (assert) {
  			assert.pushResult(resultInfo);
  		}, { validTest: true }));
  	}
  }

  var QUnit = {};
  var globalSuite = new SuiteReport();

  // The initial "currentModule" represents the global (or top-level) module that
  // is not explicitly defined by the user, therefore we add the "globalSuite" to
  // it since each module has a suiteReport associated with it.
  config.currentModule.suiteReport = globalSuite;

  var globalStartCalled = false;
  var runStarted = false;

  // Figure out if we're running the tests from a server or not
  QUnit.isLocal = !(defined.document && window.location.protocol !== "file:");

  // Expose the current QUnit version
  QUnit.version = "2.6.2";

  extend(QUnit, {
  	on: on,

  	module: module$1,

  	test: test,

  	todo: todo,

  	skip: skip,

  	only: only,

  	start: function start(count) {
  		var globalStartAlreadyCalled = globalStartCalled;

  		if (!config.current) {
  			globalStartCalled = true;

  			if (runStarted) {
  				throw new Error("Called start() while test already started running");
  			} else if (globalStartAlreadyCalled || count > 1) {
  				throw new Error("Called start() outside of a test context too many times");
  			} else if (config.autostart) {
  				throw new Error("Called start() outside of a test context when " + "QUnit.config.autostart was true");
  			} else if (!config.pageLoaded) {

  				// The page isn't completely loaded yet, so we set autostart and then
  				// load if we're in Node or wait for the browser's load event.
  				config.autostart = true;

  				// Starts from Node even if .load was not previously called. We still return
  				// early otherwise we'll wind up "beginning" twice.
  				if (!defined.document) {
  					QUnit.load();
  				}

  				return;
  			}
  		} else {
  			throw new Error("QUnit.start cannot be called inside a test context.");
  		}

  		scheduleBegin();
  	},

  	config: config,

  	is: is,

  	objectType: objectType,

  	extend: extend,

  	load: function load() {
  		config.pageLoaded = true;

  		// Initialize the configuration options
  		extend(config, {
  			stats: { all: 0, bad: 0 },
  			started: 0,
  			updateRate: 1000,
  			autostart: true,
  			filter: ""
  		}, true);

  		if (!runStarted) {
  			config.blocking = false;

  			if (config.autostart) {
  				scheduleBegin();
  			}
  		}
  	},

  	stack: function stack(offset) {
  		offset = (offset || 0) + 2;
  		return sourceFromStacktrace(offset);
  	},

  	onError: onError,

  	onUnhandledRejection: onUnhandledRejection
  });

  QUnit.pushFailure = pushFailure;
  QUnit.assert = Assert.prototype;
  QUnit.equiv = equiv;
  QUnit.dump = dump;

  registerLoggingCallbacks(QUnit);

  function scheduleBegin() {

  	runStarted = true;

  	// Add a slight delay to allow definition of more modules and tests.
  	if (defined.setTimeout) {
  		setTimeout(function () {
  			begin();
  		});
  	} else {
  		begin();
  	}
  }

  function begin() {
  	var i,
  	    l,
  	    modulesLog = [];

  	// If the test run hasn't officially begun yet
  	if (!config.started) {

  		// Record the time of the test run's beginning
  		config.started = now();

  		// Delete the loose unnamed module if unused.
  		if (config.modules[0].name === "" && config.modules[0].tests.length === 0) {
  			config.modules.shift();
  		}

  		// Avoid unnecessary information by not logging modules' test environments
  		for (i = 0, l = config.modules.length; i < l; i++) {
  			modulesLog.push({
  				name: config.modules[i].name,
  				tests: config.modules[i].tests
  			});
  		}

  		// The test run is officially beginning now
  		emit("runStart", globalSuite.start(true));
  		runLoggingCallbacks("begin", {
  			totalTests: Test.count,
  			modules: modulesLog
  		});
  	}

  	config.blocking = false;
  	ProcessingQueue.advance();
  }

  exportQUnit(QUnit);

  (function () {

  	if (typeof window === "undefined" || typeof document === "undefined") {
  		return;
  	}

  	var config = QUnit.config,
  	    hasOwn = Object.prototype.hasOwnProperty;

  	// Stores fixture HTML for resetting later
  	function storeFixture() {

  		// Avoid overwriting user-defined values
  		if (hasOwn.call(config, "fixture")) {
  			return;
  		}

  		var fixture = document.getElementById("qunit-fixture");
  		if (fixture) {
  			config.fixture = fixture.cloneNode(true);
  		}
  	}

  	QUnit.begin(storeFixture);

  	// Resets the fixture DOM element if available.
  	function resetFixture() {
  		if (config.fixture == null) {
  			return;
  		}

  		var fixture = document.getElementById("qunit-fixture");
  		var resetFixtureType = _typeof(config.fixture);
  		if (resetFixtureType === "string") {

  			// support user defined values for `config.fixture`
  			var newFixture = document.createElement("div");
  			newFixture.setAttribute("id", "qunit-fixture");
  			newFixture.innerHTML = config.fixture;
  			fixture.parentNode.replaceChild(newFixture, fixture);
  		} else {
  			var clonedFixture = config.fixture.cloneNode(true);
  			fixture.parentNode.replaceChild(clonedFixture, fixture);
  		}
  	}

  	QUnit.testStart(resetFixture);
  })();

  (function () {

  	// Only interact with URLs via window.location
  	var location = typeof window !== "undefined" && window.location;
  	if (!location) {
  		return;
  	}

  	var urlParams = getUrlParams();

  	QUnit.urlParams = urlParams;

  	// Match module/test by inclusion in an array
  	QUnit.config.moduleId = [].concat(urlParams.moduleId || []);
  	QUnit.config.testId = [].concat(urlParams.testId || []);

  	// Exact case-insensitive match of the module name
  	QUnit.config.module = urlParams.module;

  	// Regular expression or case-insenstive substring match against "moduleName: testName"
  	QUnit.config.filter = urlParams.filter;

  	// Test order randomization
  	if (urlParams.seed === true) {

  		// Generate a random seed if the option is specified without a value
  		QUnit.config.seed = Math.random().toString(36).slice(2);
  	} else if (urlParams.seed) {
  		QUnit.config.seed = urlParams.seed;
  	}

  	// Add URL-parameter-mapped config values with UI form rendering data
  	QUnit.config.urlConfig.push({
  		id: "hidepassed",
  		label: "Hide passed tests",
  		tooltip: "Only show tests and assertions that fail. Stored as query-strings."
  	}, {
  		id: "noglobals",
  		label: "Check for Globals",
  		tooltip: "Enabling this will test if any test introduces new properties on the " + "global object (`window` in Browsers). Stored as query-strings."
  	}, {
  		id: "notrycatch",
  		label: "No try-catch",
  		tooltip: "Enabling this will run tests outside of a try-catch block. Makes debugging " + "exceptions in IE reasonable. Stored as query-strings."
  	});

  	QUnit.begin(function () {
  		var i,
  		    option,
  		    urlConfig = QUnit.config.urlConfig;

  		for (i = 0; i < urlConfig.length; i++) {

  			// Options can be either strings or objects with nonempty "id" properties
  			option = QUnit.config.urlConfig[i];
  			if (typeof option !== "string") {
  				option = option.id;
  			}

  			if (QUnit.config[option] === undefined) {
  				QUnit.config[option] = urlParams[option];
  			}
  		}
  	});

  	function getUrlParams() {
  		var i, param, name, value;
  		var urlParams = Object.create(null);
  		var params = location.search.slice(1).split("&");
  		var length = params.length;

  		for (i = 0; i < length; i++) {
  			if (params[i]) {
  				param = params[i].split("=");
  				name = decodeQueryParam(param[0]);

  				// Allow just a key to turn on a flag, e.g., test.html?noglobals
  				value = param.length === 1 || decodeQueryParam(param.slice(1).join("="));
  				if (name in urlParams) {
  					urlParams[name] = [].concat(urlParams[name], value);
  				} else {
  					urlParams[name] = value;
  				}
  			}
  		}

  		return urlParams;
  	}

  	function decodeQueryParam(param) {
  		return decodeURIComponent(param.replace(/\+/g, "%20"));
  	}
  })();

  var stats = {
  	passedTests: 0,
  	failedTests: 0,
  	skippedTests: 0,
  	todoTests: 0
  };

  // Escape text for attribute or text content.
  function escapeText(s) {
  	if (!s) {
  		return "";
  	}
  	s = s + "";

  	// Both single quotes and double quotes (for attributes)
  	return s.replace(/['"<>&]/g, function (s) {
  		switch (s) {
  			case "'":
  				return "&#039;";
  			case "\"":
  				return "&quot;";
  			case "<":
  				return "&lt;";
  			case ">":
  				return "&gt;";
  			case "&":
  				return "&amp;";
  		}
  	});
  }

  (function () {

  	// Don't load the HTML Reporter on non-browser environments
  	if (typeof window === "undefined" || !window.document) {
  		return;
  	}

  	var config = QUnit.config,
  	    document$$1 = window.document,
  	    collapseNext = false,
  	    hasOwn = Object.prototype.hasOwnProperty,
  	    unfilteredUrl = setUrl({ filter: undefined, module: undefined,
  		moduleId: undefined, testId: undefined }),
  	    modulesList = [];

  	function addEvent(elem, type, fn) {
  		elem.addEventListener(type, fn, false);
  	}

  	function removeEvent(elem, type, fn) {
  		elem.removeEventListener(type, fn, false);
  	}

  	function addEvents(elems, type, fn) {
  		var i = elems.length;
  		while (i--) {
  			addEvent(elems[i], type, fn);
  		}
  	}

  	function hasClass(elem, name) {
  		return (" " + elem.className + " ").indexOf(" " + name + " ") >= 0;
  	}

  	function addClass(elem, name) {
  		if (!hasClass(elem, name)) {
  			elem.className += (elem.className ? " " : "") + name;
  		}
  	}

  	function toggleClass(elem, name, force) {
  		if (force || typeof force === "undefined" && !hasClass(elem, name)) {
  			addClass(elem, name);
  		} else {
  			removeClass(elem, name);
  		}
  	}

  	function removeClass(elem, name) {
  		var set = " " + elem.className + " ";

  		// Class name may appear multiple times
  		while (set.indexOf(" " + name + " ") >= 0) {
  			set = set.replace(" " + name + " ", " ");
  		}

  		// Trim for prettiness
  		elem.className = typeof set.trim === "function" ? set.trim() : set.replace(/^\s+|\s+$/g, "");
  	}

  	function id(name) {
  		return document$$1.getElementById && document$$1.getElementById(name);
  	}

  	function abortTests() {
  		var abortButton = id("qunit-abort-tests-button");
  		if (abortButton) {
  			abortButton.disabled = true;
  			abortButton.innerHTML = "Aborting...";
  		}
  		QUnit.config.queue.length = 0;
  		return false;
  	}

  	function interceptNavigation(ev) {
  		applyUrlParams();

  		if (ev && ev.preventDefault) {
  			ev.preventDefault();
  		}

  		return false;
  	}

  	function getUrlConfigHtml() {
  		var i,
  		    j,
  		    val,
  		    escaped,
  		    escapedTooltip,
  		    selection = false,
  		    urlConfig = config.urlConfig,
  		    urlConfigHtml = "";

  		for (i = 0; i < urlConfig.length; i++) {

  			// Options can be either strings or objects with nonempty "id" properties
  			val = config.urlConfig[i];
  			if (typeof val === "string") {
  				val = {
  					id: val,
  					label: val
  				};
  			}

  			escaped = escapeText(val.id);
  			escapedTooltip = escapeText(val.tooltip);

  			if (!val.value || typeof val.value === "string") {
  				urlConfigHtml += "<label for='qunit-urlconfig-" + escaped + "' title='" + escapedTooltip + "'><input id='qunit-urlconfig-" + escaped + "' name='" + escaped + "' type='checkbox'" + (val.value ? " value='" + escapeText(val.value) + "'" : "") + (config[val.id] ? " checked='checked'" : "") + " title='" + escapedTooltip + "' />" + escapeText(val.label) + "</label>";
  			} else {
  				urlConfigHtml += "<label for='qunit-urlconfig-" + escaped + "' title='" + escapedTooltip + "'>" + val.label + ": </label><select id='qunit-urlconfig-" + escaped + "' name='" + escaped + "' title='" + escapedTooltip + "'><option></option>";

  				if (QUnit.is("array", val.value)) {
  					for (j = 0; j < val.value.length; j++) {
  						escaped = escapeText(val.value[j]);
  						urlConfigHtml += "<option value='" + escaped + "'" + (config[val.id] === val.value[j] ? (selection = true) && " selected='selected'" : "") + ">" + escaped + "</option>";
  					}
  				} else {
  					for (j in val.value) {
  						if (hasOwn.call(val.value, j)) {
  							urlConfigHtml += "<option value='" + escapeText(j) + "'" + (config[val.id] === j ? (selection = true) && " selected='selected'" : "") + ">" + escapeText(val.value[j]) + "</option>";
  						}
  					}
  				}
  				if (config[val.id] && !selection) {
  					escaped = escapeText(config[val.id]);
  					urlConfigHtml += "<option value='" + escaped + "' selected='selected' disabled='disabled'>" + escaped + "</option>";
  				}
  				urlConfigHtml += "</select>";
  			}
  		}

  		return urlConfigHtml;
  	}

  	// Handle "click" events on toolbar checkboxes and "change" for select menus.
  	// Updates the URL with the new state of `config.urlConfig` values.
  	function toolbarChanged() {
  		var updatedUrl,
  		    value,
  		    tests,
  		    field = this,
  		    params = {};

  		// Detect if field is a select menu or a checkbox
  		if ("selectedIndex" in field) {
  			value = field.options[field.selectedIndex].value || undefined;
  		} else {
  			value = field.checked ? field.defaultValue || true : undefined;
  		}

  		params[field.name] = value;
  		updatedUrl = setUrl(params);

  		// Check if we can apply the change without a page refresh
  		if ("hidepassed" === field.name && "replaceState" in window.history) {
  			QUnit.urlParams[field.name] = value;
  			config[field.name] = value || false;
  			tests = id("qunit-tests");
  			if (tests) {
  				toggleClass(tests, "hidepass", value || false);
  			}
  			window.history.replaceState(null, "", updatedUrl);
  		} else {
  			window.location = updatedUrl;
  		}
  	}

  	function setUrl(params) {
  		var key,
  		    arrValue,
  		    i,
  		    querystring = "?",
  		    location = window.location;

  		params = QUnit.extend(QUnit.extend({}, QUnit.urlParams), params);

  		for (key in params) {

  			// Skip inherited or undefined properties
  			if (hasOwn.call(params, key) && params[key] !== undefined) {

  				// Output a parameter for each value of this key
  				// (but usually just one)
  				arrValue = [].concat(params[key]);
  				for (i = 0; i < arrValue.length; i++) {
  					querystring += encodeURIComponent(key);
  					if (arrValue[i] !== true) {
  						querystring += "=" + encodeURIComponent(arrValue[i]);
  					}
  					querystring += "&";
  				}
  			}
  		}
  		return location.protocol + "//" + location.host + location.pathname + querystring.slice(0, -1);
  	}

  	function applyUrlParams() {
  		var i,
  		    selectedModules = [],
  		    modulesList = id("qunit-modulefilter-dropdown-list").getElementsByTagName("input"),
  		    filter = id("qunit-filter-input").value;

  		for (i = 0; i < modulesList.length; i++) {
  			if (modulesList[i].checked) {
  				selectedModules.push(modulesList[i].value);
  			}
  		}

  		window.location = setUrl({
  			filter: filter === "" ? undefined : filter,
  			moduleId: selectedModules.length === 0 ? undefined : selectedModules,

  			// Remove module and testId filter
  			module: undefined,
  			testId: undefined
  		});
  	}

  	function toolbarUrlConfigContainer() {
  		var urlConfigContainer = document$$1.createElement("span");

  		urlConfigContainer.innerHTML = getUrlConfigHtml();
  		addClass(urlConfigContainer, "qunit-url-config");

  		addEvents(urlConfigContainer.getElementsByTagName("input"), "change", toolbarChanged);
  		addEvents(urlConfigContainer.getElementsByTagName("select"), "change", toolbarChanged);

  		return urlConfigContainer;
  	}

  	function abortTestsButton() {
  		var button = document$$1.createElement("button");
  		button.id = "qunit-abort-tests-button";
  		button.innerHTML = "Abort";
  		addEvent(button, "click", abortTests);
  		return button;
  	}

  	function toolbarLooseFilter() {
  		var filter = document$$1.createElement("form"),
  		    label = document$$1.createElement("label"),
  		    input = document$$1.createElement("input"),
  		    button = document$$1.createElement("button");

  		addClass(filter, "qunit-filter");

  		label.innerHTML = "Filter: ";

  		input.type = "text";
  		input.value = config.filter || "";
  		input.name = "filter";
  		input.id = "qunit-filter-input";

  		button.innerHTML = "Go";

  		label.appendChild(input);

  		filter.appendChild(label);
  		filter.appendChild(document$$1.createTextNode(" "));
  		filter.appendChild(button);
  		addEvent(filter, "submit", interceptNavigation);

  		return filter;
  	}

  	function moduleListHtml() {
  		var i,
  		    checked,
  		    html = "";

  		for (i = 0; i < config.modules.length; i++) {
  			if (config.modules[i].name !== "") {
  				checked = config.moduleId.indexOf(config.modules[i].moduleId) > -1;
  				html += "<li><label class='clickable" + (checked ? " checked" : "") + "'><input type='checkbox' " + "value='" + config.modules[i].moduleId + "'" + (checked ? " checked='checked'" : "") + " />" + escapeText(config.modules[i].name) + "</label></li>";
  			}
  		}

  		return html;
  	}

  	function toolbarModuleFilter() {
  		var allCheckbox,
  		    commit,
  		    reset,
  		    moduleFilter = document$$1.createElement("form"),
  		    label = document$$1.createElement("label"),
  		    moduleSearch = document$$1.createElement("input"),
  		    dropDown = document$$1.createElement("div"),
  		    actions = document$$1.createElement("span"),
  		    dropDownList = document$$1.createElement("ul"),
  		    dirty = false;

  		moduleSearch.id = "qunit-modulefilter-search";
  		moduleSearch.autocomplete = "off";
  		addEvent(moduleSearch, "input", searchInput);
  		addEvent(moduleSearch, "input", searchFocus);
  		addEvent(moduleSearch, "focus", searchFocus);
  		addEvent(moduleSearch, "click", searchFocus);

  		label.id = "qunit-modulefilter-search-container";
  		label.innerHTML = "Module: ";
  		label.appendChild(moduleSearch);

  		actions.id = "qunit-modulefilter-actions";
  		actions.innerHTML = "<button style='display:none'>Apply</button>" + "<button type='reset' style='display:none'>Reset</button>" + "<label class='clickable" + (config.moduleId.length ? "" : " checked") + "'><input type='checkbox'" + (config.moduleId.length ? "" : " checked='checked'") + ">All modules</label>";
  		allCheckbox = actions.lastChild.firstChild;
  		commit = actions.firstChild;
  		reset = commit.nextSibling;
  		addEvent(commit, "click", applyUrlParams);

  		dropDownList.id = "qunit-modulefilter-dropdown-list";
  		dropDownList.innerHTML = moduleListHtml();

  		dropDown.id = "qunit-modulefilter-dropdown";
  		dropDown.style.display = "none";
  		dropDown.appendChild(actions);
  		dropDown.appendChild(dropDownList);
  		addEvent(dropDown, "change", selectionChange);
  		selectionChange();

  		moduleFilter.id = "qunit-modulefilter";
  		moduleFilter.appendChild(label);
  		moduleFilter.appendChild(dropDown);
  		addEvent(moduleFilter, "submit", interceptNavigation);
  		addEvent(moduleFilter, "reset", function () {

  			// Let the reset happen, then update styles
  			window.setTimeout(selectionChange);
  		});

  		// Enables show/hide for the dropdown
  		function searchFocus() {
  			if (dropDown.style.display !== "none") {
  				return;
  			}

  			dropDown.style.display = "block";
  			addEvent(document$$1, "click", hideHandler);
  			addEvent(document$$1, "keydown", hideHandler);

  			// Hide on Escape keydown or outside-container click
  			function hideHandler(e) {
  				var inContainer = moduleFilter.contains(e.target);

  				if (e.keyCode === 27 || !inContainer) {
  					if (e.keyCode === 27 && inContainer) {
  						moduleSearch.focus();
  					}
  					dropDown.style.display = "none";
  					removeEvent(document$$1, "click", hideHandler);
  					removeEvent(document$$1, "keydown", hideHandler);
  					moduleSearch.value = "";
  					searchInput();
  				}
  			}
  		}

  		// Processes module search box input
  		function searchInput() {
  			var i,
  			    item,
  			    searchText = moduleSearch.value.toLowerCase(),
  			    listItems = dropDownList.children;

  			for (i = 0; i < listItems.length; i++) {
  				item = listItems[i];
  				if (!searchText || item.textContent.toLowerCase().indexOf(searchText) > -1) {
  					item.style.display = "";
  				} else {
  					item.style.display = "none";
  				}
  			}
  		}

  		// Processes selection changes
  		function selectionChange(evt) {
  			var i,
  			    item,
  			    checkbox = evt && evt.target || allCheckbox,
  			    modulesList = dropDownList.getElementsByTagName("input"),
  			    selectedNames = [];

  			toggleClass(checkbox.parentNode, "checked", checkbox.checked);

  			dirty = false;
  			if (checkbox.checked && checkbox !== allCheckbox) {
  				allCheckbox.checked = false;
  				removeClass(allCheckbox.parentNode, "checked");
  			}
  			for (i = 0; i < modulesList.length; i++) {
  				item = modulesList[i];
  				if (!evt) {
  					toggleClass(item.parentNode, "checked", item.checked);
  				} else if (checkbox === allCheckbox && checkbox.checked) {
  					item.checked = false;
  					removeClass(item.parentNode, "checked");
  				}
  				dirty = dirty || item.checked !== item.defaultChecked;
  				if (item.checked) {
  					selectedNames.push(item.parentNode.textContent);
  				}
  			}

  			commit.style.display = reset.style.display = dirty ? "" : "none";
  			moduleSearch.placeholder = selectedNames.join(", ") || allCheckbox.parentNode.textContent;
  			moduleSearch.title = "Type to filter list. Current selection:\n" + (selectedNames.join("\n") || allCheckbox.parentNode.textContent);
  		}

  		return moduleFilter;
  	}

  	function appendToolbar() {
  		var toolbar = id("qunit-testrunner-toolbar");

  		if (toolbar) {
  			toolbar.appendChild(toolbarUrlConfigContainer());
  			toolbar.appendChild(toolbarModuleFilter());
  			toolbar.appendChild(toolbarLooseFilter());
  			toolbar.appendChild(document$$1.createElement("div")).className = "clearfix";
  		}
  	}

  	function appendHeader() {
  		var header = id("qunit-header");

  		if (header) {
  			header.innerHTML = "<a href='" + escapeText(unfilteredUrl) + "'>" + header.innerHTML + "</a> ";
  		}
  	}

  	function appendBanner() {
  		var banner = id("qunit-banner");

  		if (banner) {
  			banner.className = "";
  		}
  	}

  	function appendTestResults() {
  		var tests = id("qunit-tests"),
  		    result = id("qunit-testresult"),
  		    controls;

  		if (result) {
  			result.parentNode.removeChild(result);
  		}

  		if (tests) {
  			tests.innerHTML = "";
  			result = document$$1.createElement("p");
  			result.id = "qunit-testresult";
  			result.className = "result";
  			tests.parentNode.insertBefore(result, tests);
  			result.innerHTML = "<div id=\"qunit-testresult-display\">Running...<br />&#160;</div>" + "<div id=\"qunit-testresult-controls\"></div>" + "<div class=\"clearfix\"></div>";
  			controls = id("qunit-testresult-controls");
  		}

  		if (controls) {
  			controls.appendChild(abortTestsButton());
  		}
  	}

  	function appendFilteredTest() {
  		var testId = QUnit.config.testId;
  		if (!testId || testId.length <= 0) {
  			return "";
  		}
  		return "<div id='qunit-filteredTest'>Rerunning selected tests: " + escapeText(testId.join(", ")) + " <a id='qunit-clearFilter' href='" + escapeText(unfilteredUrl) + "'>Run all tests</a></div>";
  	}

  	function appendUserAgent() {
  		var userAgent = id("qunit-userAgent");

  		if (userAgent) {
  			userAgent.innerHTML = "";
  			userAgent.appendChild(document$$1.createTextNode("QUnit " + QUnit.version + "; " + navigator.userAgent));
  		}
  	}

  	function appendInterface() {
  		var qunit = id("qunit");

  		if (qunit) {
  			qunit.innerHTML = "<h1 id='qunit-header'>" + escapeText(document$$1.title) + "</h1>" + "<h2 id='qunit-banner'></h2>" + "<div id='qunit-testrunner-toolbar'></div>" + appendFilteredTest() + "<h2 id='qunit-userAgent'></h2>" + "<ol id='qunit-tests'></ol>";
  		}

  		appendHeader();
  		appendBanner();
  		appendTestResults();
  		appendUserAgent();
  		appendToolbar();
  	}

  	function appendTestsList(modules) {
  		var i, l, x, z, test, moduleObj;

  		for (i = 0, l = modules.length; i < l; i++) {
  			moduleObj = modules[i];

  			for (x = 0, z = moduleObj.tests.length; x < z; x++) {
  				test = moduleObj.tests[x];

  				appendTest(test.name, test.testId, moduleObj.name);
  			}
  		}
  	}

  	function appendTest(name, testId, moduleName) {
  		var title,
  		    rerunTrigger,
  		    testBlock,
  		    assertList,
  		    tests = id("qunit-tests");

  		if (!tests) {
  			return;
  		}

  		title = document$$1.createElement("strong");
  		title.innerHTML = getNameHtml(name, moduleName);

  		rerunTrigger = document$$1.createElement("a");
  		rerunTrigger.innerHTML = "Rerun";
  		rerunTrigger.href = setUrl({ testId: testId });

  		testBlock = document$$1.createElement("li");
  		testBlock.appendChild(title);
  		testBlock.appendChild(rerunTrigger);
  		testBlock.id = "qunit-test-output-" + testId;

  		assertList = document$$1.createElement("ol");
  		assertList.className = "qunit-assert-list";

  		testBlock.appendChild(assertList);

  		tests.appendChild(testBlock);
  	}

  	// HTML Reporter initialization and load
  	QUnit.begin(function (details) {
  		var i, moduleObj, tests;

  		// Sort modules by name for the picker
  		for (i = 0; i < details.modules.length; i++) {
  			moduleObj = details.modules[i];
  			if (moduleObj.name) {
  				modulesList.push(moduleObj.name);
  			}
  		}
  		modulesList.sort(function (a, b) {
  			return a.localeCompare(b);
  		});

  		// Initialize QUnit elements
  		appendInterface();
  		appendTestsList(details.modules);
  		tests = id("qunit-tests");
  		if (tests && config.hidepassed) {
  			addClass(tests, "hidepass");
  		}
  	});

  	QUnit.done(function (details) {
  		var banner = id("qunit-banner"),
  		    tests = id("qunit-tests"),
  		    abortButton = id("qunit-abort-tests-button"),
  		    totalTests = stats.passedTests + stats.skippedTests + stats.todoTests + stats.failedTests,
  		    html = [totalTests, " tests completed in ", details.runtime, " milliseconds, with ", stats.failedTests, " failed, ", stats.skippedTests, " skipped, and ", stats.todoTests, " todo.<br />", "<span class='passed'>", details.passed, "</span> assertions of <span class='total'>", details.total, "</span> passed, <span class='failed'>", details.failed, "</span> failed."].join(""),
  		    test,
  		    assertLi,
  		    assertList;

  		// Update remaing tests to aborted
  		if (abortButton && abortButton.disabled) {
  			html = "Tests aborted after " + details.runtime + " milliseconds.";

  			for (var i = 0; i < tests.children.length; i++) {
  				test = tests.children[i];
  				if (test.className === "" || test.className === "running") {
  					test.className = "aborted";
  					assertList = test.getElementsByTagName("ol")[0];
  					assertLi = document$$1.createElement("li");
  					assertLi.className = "fail";
  					assertLi.innerHTML = "Test aborted.";
  					assertList.appendChild(assertLi);
  				}
  			}
  		}

  		if (banner && (!abortButton || abortButton.disabled === false)) {
  			banner.className = stats.failedTests ? "qunit-fail" : "qunit-pass";
  		}

  		if (abortButton) {
  			abortButton.parentNode.removeChild(abortButton);
  		}

  		if (tests) {
  			id("qunit-testresult-display").innerHTML = html;
  		}

  		if (config.altertitle && document$$1.title) {

  			// Show ✖ for good, ✔ for bad suite result in title
  			// use escape sequences in case file gets loaded with non-utf-8
  			// charset
  			document$$1.title = [stats.failedTests ? "\u2716" : "\u2714", document$$1.title.replace(/^[\u2714\u2716] /i, "")].join(" ");
  		}

  		// Scroll back to top to show results
  		if (config.scrolltop && window.scrollTo) {
  			window.scrollTo(0, 0);
  		}
  	});

  	function getNameHtml(name, module) {
  		var nameHtml = "";

  		if (module) {
  			nameHtml = "<span class='module-name'>" + escapeText(module) + "</span>: ";
  		}

  		nameHtml += "<span class='test-name'>" + escapeText(name) + "</span>";

  		return nameHtml;
  	}

  	QUnit.testStart(function (details) {
  		var running, testBlock, bad;

  		testBlock = id("qunit-test-output-" + details.testId);
  		if (testBlock) {
  			testBlock.className = "running";
  		} else {

  			// Report later registered tests
  			appendTest(details.name, details.testId, details.module);
  		}

  		running = id("qunit-testresult-display");
  		if (running) {
  			bad = QUnit.config.reorder && details.previousFailure;

  			running.innerHTML = [bad ? "Rerunning previously failed test: <br />" : "Running: <br />", getNameHtml(details.name, details.module)].join("");
  		}
  	});

  	function stripHtml(string) {

  		// Strip tags, html entity and whitespaces
  		return string.replace(/<\/?[^>]+(>|$)/g, "").replace(/&quot;/g, "").replace(/\s+/g, "");
  	}

  	QUnit.log(function (details) {
  		var assertList,
  		    assertLi,
  		    message,
  		    expected,
  		    actual,
  		    diff,
  		    showDiff = false,
  		    testItem = id("qunit-test-output-" + details.testId);

  		if (!testItem) {
  			return;
  		}

  		message = escapeText(details.message) || (details.result ? "okay" : "failed");
  		message = "<span class='test-message'>" + message + "</span>";
  		message += "<span class='runtime'>@ " + details.runtime + " ms</span>";

  		// The pushFailure doesn't provide details.expected
  		// when it calls, it's implicit to also not show expected and diff stuff
  		// Also, we need to check details.expected existence, as it can exist and be undefined
  		if (!details.result && hasOwn.call(details, "expected")) {
  			if (details.negative) {
  				expected = "NOT " + QUnit.dump.parse(details.expected);
  			} else {
  				expected = QUnit.dump.parse(details.expected);
  			}

  			actual = QUnit.dump.parse(details.actual);
  			message += "<table><tr class='test-expected'><th>Expected: </th><td><pre>" + escapeText(expected) + "</pre></td></tr>";

  			if (actual !== expected) {

  				message += "<tr class='test-actual'><th>Result: </th><td><pre>" + escapeText(actual) + "</pre></td></tr>";

  				if (typeof details.actual === "number" && typeof details.expected === "number") {
  					if (!isNaN(details.actual) && !isNaN(details.expected)) {
  						showDiff = true;
  						diff = details.actual - details.expected;
  						diff = (diff > 0 ? "+" : "") + diff;
  					}
  				} else if (typeof details.actual !== "boolean" && typeof details.expected !== "boolean") {
  					diff = QUnit.diff(expected, actual);

  					// don't show diff if there is zero overlap
  					showDiff = stripHtml(diff).length !== stripHtml(expected).length + stripHtml(actual).length;
  				}

  				if (showDiff) {
  					message += "<tr class='test-diff'><th>Diff: </th><td><pre>" + diff + "</pre></td></tr>";
  				}
  			} else if (expected.indexOf("[object Array]") !== -1 || expected.indexOf("[object Object]") !== -1) {
  				message += "<tr class='test-message'><th>Message: </th><td>" + "Diff suppressed as the depth of object is more than current max depth (" + QUnit.config.maxDepth + ").<p>Hint: Use <code>QUnit.dump.maxDepth</code> to " + " run with a higher max depth or <a href='" + escapeText(setUrl({ maxDepth: -1 })) + "'>" + "Rerun</a> without max depth.</p></td></tr>";
  			} else {
  				message += "<tr class='test-message'><th>Message: </th><td>" + "Diff suppressed as the expected and actual results have an equivalent" + " serialization</td></tr>";
  			}

  			if (details.source) {
  				message += "<tr class='test-source'><th>Source: </th><td><pre>" + escapeText(details.source) + "</pre></td></tr>";
  			}

  			message += "</table>";

  			// This occurs when pushFailure is set and we have an extracted stack trace
  		} else if (!details.result && details.source) {
  			message += "<table>" + "<tr class='test-source'><th>Source: </th><td><pre>" + escapeText(details.source) + "</pre></td></tr>" + "</table>";
  		}

  		assertList = testItem.getElementsByTagName("ol")[0];

  		assertLi = document$$1.createElement("li");
  		assertLi.className = details.result ? "pass" : "fail";
  		assertLi.innerHTML = message;
  		assertList.appendChild(assertLi);
  	});

  	QUnit.testDone(function (details) {
  		var testTitle,
  		    time,
  		    testItem,
  		    assertList,
  		    good,
  		    bad,
  		    testCounts,
  		    skipped,
  		    sourceName,
  		    tests = id("qunit-tests");

  		if (!tests) {
  			return;
  		}

  		testItem = id("qunit-test-output-" + details.testId);

  		assertList = testItem.getElementsByTagName("ol")[0];

  		good = details.passed;
  		bad = details.failed;

  		// This test passed if it has no unexpected failed assertions
  		var testPassed = details.failed > 0 ? details.todo : !details.todo;

  		if (testPassed) {

  			// Collapse the passing tests
  			addClass(assertList, "qunit-collapsed");
  		} else if (config.collapse) {
  			if (!collapseNext) {

  				// Skip collapsing the first failing test
  				collapseNext = true;
  			} else {

  				// Collapse remaining tests
  				addClass(assertList, "qunit-collapsed");
  			}
  		}

  		// The testItem.firstChild is the test name
  		testTitle = testItem.firstChild;

  		testCounts = bad ? "<b class='failed'>" + bad + "</b>, " + "<b class='passed'>" + good + "</b>, " : "";

  		testTitle.innerHTML += " <b class='counts'>(" + testCounts + details.assertions.length + ")</b>";

  		if (details.skipped) {
  			stats.skippedTests++;

  			testItem.className = "skipped";
  			skipped = document$$1.createElement("em");
  			skipped.className = "qunit-skipped-label";
  			skipped.innerHTML = "skipped";
  			testItem.insertBefore(skipped, testTitle);
  		} else {
  			addEvent(testTitle, "click", function () {
  				toggleClass(assertList, "qunit-collapsed");
  			});

  			testItem.className = testPassed ? "pass" : "fail";

  			if (details.todo) {
  				var todoLabel = document$$1.createElement("em");
  				todoLabel.className = "qunit-todo-label";
  				todoLabel.innerHTML = "todo";
  				testItem.className += " todo";
  				testItem.insertBefore(todoLabel, testTitle);
  			}

  			time = document$$1.createElement("span");
  			time.className = "runtime";
  			time.innerHTML = details.runtime + " ms";
  			testItem.insertBefore(time, assertList);

  			if (!testPassed) {
  				stats.failedTests++;
  			} else if (details.todo) {
  				stats.todoTests++;
  			} else {
  				stats.passedTests++;
  			}
  		}

  		// Show the source of the test when showing assertions
  		if (details.source) {
  			sourceName = document$$1.createElement("p");
  			sourceName.innerHTML = "<strong>Source: </strong>" + details.source;
  			addClass(sourceName, "qunit-source");
  			if (testPassed) {
  				addClass(sourceName, "qunit-collapsed");
  			}
  			addEvent(testTitle, "click", function () {
  				toggleClass(sourceName, "qunit-collapsed");
  			});
  			testItem.appendChild(sourceName);
  		}
  	});

  	// Avoid readyState issue with phantomjs
  	// Ref: #818
  	var notPhantom = function (p) {
  		return !(p && p.version && p.version.major > 0);
  	}(window.phantom);

  	if (notPhantom && document$$1.readyState === "complete") {
  		QUnit.load();
  	} else {
  		addEvent(window, "load", QUnit.load);
  	}

  	// Wrap window.onerror. We will call the original window.onerror to see if
  	// the existing handler fully handles the error; if not, we will call the
  	// QUnit.onError function.
  	var originalWindowOnError = window.onerror;

  	// Cover uncaught exceptions
  	// Returning true will suppress the default browser handler,
  	// returning false will let it run.
  	window.onerror = function (message, fileName, lineNumber) {
  		var ret = false;
  		if (originalWindowOnError) {
  			for (var _len = arguments.length, args = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
  				args[_key - 3] = arguments[_key];
  			}

  			ret = originalWindowOnError.call.apply(originalWindowOnError, [this, message, fileName, lineNumber].concat(args));
  		}

  		// Treat return value as window.onerror itself does,
  		// Only do our handling if not suppressed.
  		if (ret !== true) {
  			var error = {
  				message: message,
  				fileName: fileName,
  				lineNumber: lineNumber
  			};

  			ret = QUnit.onError(error);
  		}

  		return ret;
  	};

  	// Listen for unhandled rejections, and call QUnit.onUnhandledRejection
  	window.addEventListener("unhandledrejection", function (event) {
  		QUnit.onUnhandledRejection(event.reason);
  	});
  })();

  /*
   * This file is a modified version of google-diff-match-patch's JavaScript implementation
   * (https://code.google.com/p/google-diff-match-patch/source/browse/trunk/javascript/diff_match_patch_uncompressed.js),
   * modifications are licensed as more fully set forth in LICENSE.txt.
   *
   * The original source of google-diff-match-patch is attributable and licensed as follows:
   *
   * Copyright 2006 Google Inc.
   * https://code.google.com/p/google-diff-match-patch/
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * https://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *
   * More Info:
   *  https://code.google.com/p/google-diff-match-patch/
   *
   * Usage: QUnit.diff(expected, actual)
   *
   */
  QUnit.diff = function () {
  	function DiffMatchPatch() {}

  	//  DIFF FUNCTIONS

  	/**
    * The data structure representing a diff is an array of tuples:
    * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
    * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
    */
  	var DIFF_DELETE = -1,
  	    DIFF_INSERT = 1,
  	    DIFF_EQUAL = 0;

  	/**
    * Find the differences between two texts.  Simplifies the problem by stripping
    * any common prefix or suffix off the texts before diffing.
    * @param {string} text1 Old string to be diffed.
    * @param {string} text2 New string to be diffed.
    * @param {boolean=} optChecklines Optional speedup flag. If present and false,
    *     then don't run a line-level diff first to identify the changed areas.
    *     Defaults to true, which does a faster, slightly less optimal diff.
    * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
    */
  	DiffMatchPatch.prototype.DiffMain = function (text1, text2, optChecklines) {
  		var deadline, checklines, commonlength, commonprefix, commonsuffix, diffs;

  		// The diff must be complete in up to 1 second.
  		deadline = new Date().getTime() + 1000;

  		// Check for null inputs.
  		if (text1 === null || text2 === null) {
  			throw new Error("Null input. (DiffMain)");
  		}

  		// Check for equality (speedup).
  		if (text1 === text2) {
  			if (text1) {
  				return [[DIFF_EQUAL, text1]];
  			}
  			return [];
  		}

  		if (typeof optChecklines === "undefined") {
  			optChecklines = true;
  		}

  		checklines = optChecklines;

  		// Trim off common prefix (speedup).
  		commonlength = this.diffCommonPrefix(text1, text2);
  		commonprefix = text1.substring(0, commonlength);
  		text1 = text1.substring(commonlength);
  		text2 = text2.substring(commonlength);

  		// Trim off common suffix (speedup).
  		commonlength = this.diffCommonSuffix(text1, text2);
  		commonsuffix = text1.substring(text1.length - commonlength);
  		text1 = text1.substring(0, text1.length - commonlength);
  		text2 = text2.substring(0, text2.length - commonlength);

  		// Compute the diff on the middle block.
  		diffs = this.diffCompute(text1, text2, checklines, deadline);

  		// Restore the prefix and suffix.
  		if (commonprefix) {
  			diffs.unshift([DIFF_EQUAL, commonprefix]);
  		}
  		if (commonsuffix) {
  			diffs.push([DIFF_EQUAL, commonsuffix]);
  		}
  		this.diffCleanupMerge(diffs);
  		return diffs;
  	};

  	/**
    * Reduce the number of edits by eliminating operationally trivial equalities.
    * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
    */
  	DiffMatchPatch.prototype.diffCleanupEfficiency = function (diffs) {
  		var changes, equalities, equalitiesLength, lastequality, pointer, preIns, preDel, postIns, postDel;
  		changes = false;
  		equalities = []; // Stack of indices where equalities are found.
  		equalitiesLength = 0; // Keeping our own length var is faster in JS.
  		/** @type {?string} */
  		lastequality = null;

  		// Always equal to diffs[equalities[equalitiesLength - 1]][1]
  		pointer = 0; // Index of current position.

  		// Is there an insertion operation before the last equality.
  		preIns = false;

  		// Is there a deletion operation before the last equality.
  		preDel = false;

  		// Is there an insertion operation after the last equality.
  		postIns = false;

  		// Is there a deletion operation after the last equality.
  		postDel = false;
  		while (pointer < diffs.length) {

  			// Equality found.
  			if (diffs[pointer][0] === DIFF_EQUAL) {
  				if (diffs[pointer][1].length < 4 && (postIns || postDel)) {

  					// Candidate found.
  					equalities[equalitiesLength++] = pointer;
  					preIns = postIns;
  					preDel = postDel;
  					lastequality = diffs[pointer][1];
  				} else {

  					// Not a candidate, and can never become one.
  					equalitiesLength = 0;
  					lastequality = null;
  				}
  				postIns = postDel = false;

  				// An insertion or deletion.
  			} else {

  				if (diffs[pointer][0] === DIFF_DELETE) {
  					postDel = true;
  				} else {
  					postIns = true;
  				}

  				/*
       * Five types to be split:
       * <ins>A</ins><del>B</del>XY<ins>C</ins><del>D</del>
       * <ins>A</ins>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<ins>C</ins>
       * <ins>A</del>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<del>C</del>
       */
  				if (lastequality && (preIns && preDel && postIns && postDel || lastequality.length < 2 && preIns + preDel + postIns + postDel === 3)) {

  					// Duplicate record.
  					diffs.splice(equalities[equalitiesLength - 1], 0, [DIFF_DELETE, lastequality]);

  					// Change second copy to insert.
  					diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
  					equalitiesLength--; // Throw away the equality we just deleted;
  					lastequality = null;
  					if (preIns && preDel) {

  						// No changes made which could affect previous entry, keep going.
  						postIns = postDel = true;
  						equalitiesLength = 0;
  					} else {
  						equalitiesLength--; // Throw away the previous equality.
  						pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
  						postIns = postDel = false;
  					}
  					changes = true;
  				}
  			}
  			pointer++;
  		}

  		if (changes) {
  			this.diffCleanupMerge(diffs);
  		}
  	};

  	/**
    * Convert a diff array into a pretty HTML report.
    * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
    * @param {integer} string to be beautified.
    * @return {string} HTML representation.
    */
  	DiffMatchPatch.prototype.diffPrettyHtml = function (diffs) {
  		var op,
  		    data,
  		    x,
  		    html = [];
  		for (x = 0; x < diffs.length; x++) {
  			op = diffs[x][0]; // Operation (insert, delete, equal)
  			data = diffs[x][1]; // Text of change.
  			switch (op) {
  				case DIFF_INSERT:
  					html[x] = "<ins>" + escapeText(data) + "</ins>";
  					break;
  				case DIFF_DELETE:
  					html[x] = "<del>" + escapeText(data) + "</del>";
  					break;
  				case DIFF_EQUAL:
  					html[x] = "<span>" + escapeText(data) + "</span>";
  					break;
  			}
  		}
  		return html.join("");
  	};

  	/**
    * Determine the common prefix of two strings.
    * @param {string} text1 First string.
    * @param {string} text2 Second string.
    * @return {number} The number of characters common to the start of each
    *     string.
    */
  	DiffMatchPatch.prototype.diffCommonPrefix = function (text1, text2) {
  		var pointermid, pointermax, pointermin, pointerstart;

  		// Quick check for common null cases.
  		if (!text1 || !text2 || text1.charAt(0) !== text2.charAt(0)) {
  			return 0;
  		}

  		// Binary search.
  		// Performance analysis: https://neil.fraser.name/news/2007/10/09/
  		pointermin = 0;
  		pointermax = Math.min(text1.length, text2.length);
  		pointermid = pointermax;
  		pointerstart = 0;
  		while (pointermin < pointermid) {
  			if (text1.substring(pointerstart, pointermid) === text2.substring(pointerstart, pointermid)) {
  				pointermin = pointermid;
  				pointerstart = pointermin;
  			} else {
  				pointermax = pointermid;
  			}
  			pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  		}
  		return pointermid;
  	};

  	/**
    * Determine the common suffix of two strings.
    * @param {string} text1 First string.
    * @param {string} text2 Second string.
    * @return {number} The number of characters common to the end of each string.
    */
  	DiffMatchPatch.prototype.diffCommonSuffix = function (text1, text2) {
  		var pointermid, pointermax, pointermin, pointerend;

  		// Quick check for common null cases.
  		if (!text1 || !text2 || text1.charAt(text1.length - 1) !== text2.charAt(text2.length - 1)) {
  			return 0;
  		}

  		// Binary search.
  		// Performance analysis: https://neil.fraser.name/news/2007/10/09/
  		pointermin = 0;
  		pointermax = Math.min(text1.length, text2.length);
  		pointermid = pointermax;
  		pointerend = 0;
  		while (pointermin < pointermid) {
  			if (text1.substring(text1.length - pointermid, text1.length - pointerend) === text2.substring(text2.length - pointermid, text2.length - pointerend)) {
  				pointermin = pointermid;
  				pointerend = pointermin;
  			} else {
  				pointermax = pointermid;
  			}
  			pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  		}
  		return pointermid;
  	};

  	/**
    * Find the differences between two texts.  Assumes that the texts do not
    * have any common prefix or suffix.
    * @param {string} text1 Old string to be diffed.
    * @param {string} text2 New string to be diffed.
    * @param {boolean} checklines Speedup flag.  If false, then don't run a
    *     line-level diff first to identify the changed areas.
    *     If true, then run a faster, slightly less optimal diff.
    * @param {number} deadline Time when the diff should be complete by.
    * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
    * @private
    */
  	DiffMatchPatch.prototype.diffCompute = function (text1, text2, checklines, deadline) {
  		var diffs, longtext, shorttext, i, hm, text1A, text2A, text1B, text2B, midCommon, diffsA, diffsB;

  		if (!text1) {

  			// Just add some text (speedup).
  			return [[DIFF_INSERT, text2]];
  		}

  		if (!text2) {

  			// Just delete some text (speedup).
  			return [[DIFF_DELETE, text1]];
  		}

  		longtext = text1.length > text2.length ? text1 : text2;
  		shorttext = text1.length > text2.length ? text2 : text1;
  		i = longtext.indexOf(shorttext);
  		if (i !== -1) {

  			// Shorter text is inside the longer text (speedup).
  			diffs = [[DIFF_INSERT, longtext.substring(0, i)], [DIFF_EQUAL, shorttext], [DIFF_INSERT, longtext.substring(i + shorttext.length)]];

  			// Swap insertions for deletions if diff is reversed.
  			if (text1.length > text2.length) {
  				diffs[0][0] = diffs[2][0] = DIFF_DELETE;
  			}
  			return diffs;
  		}

  		if (shorttext.length === 1) {

  			// Single character string.
  			// After the previous speedup, the character can't be an equality.
  			return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  		}

  		// Check to see if the problem can be split in two.
  		hm = this.diffHalfMatch(text1, text2);
  		if (hm) {

  			// A half-match was found, sort out the return data.
  			text1A = hm[0];
  			text1B = hm[1];
  			text2A = hm[2];
  			text2B = hm[3];
  			midCommon = hm[4];

  			// Send both pairs off for separate processing.
  			diffsA = this.DiffMain(text1A, text2A, checklines, deadline);
  			diffsB = this.DiffMain(text1B, text2B, checklines, deadline);

  			// Merge the results.
  			return diffsA.concat([[DIFF_EQUAL, midCommon]], diffsB);
  		}

  		if (checklines && text1.length > 100 && text2.length > 100) {
  			return this.diffLineMode(text1, text2, deadline);
  		}

  		return this.diffBisect(text1, text2, deadline);
  	};

  	/**
    * Do the two texts share a substring which is at least half the length of the
    * longer text?
    * This speedup can produce non-minimal diffs.
    * @param {string} text1 First string.
    * @param {string} text2 Second string.
    * @return {Array.<string>} Five element Array, containing the prefix of
    *     text1, the suffix of text1, the prefix of text2, the suffix of
    *     text2 and the common middle.  Or null if there was no match.
    * @private
    */
  	DiffMatchPatch.prototype.diffHalfMatch = function (text1, text2) {
  		var longtext, shorttext, dmp, text1A, text2B, text2A, text1B, midCommon, hm1, hm2, hm;

  		longtext = text1.length > text2.length ? text1 : text2;
  		shorttext = text1.length > text2.length ? text2 : text1;
  		if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
  			return null; // Pointless.
  		}
  		dmp = this; // 'this' becomes 'window' in a closure.

  		/**
     * Does a substring of shorttext exist within longtext such that the substring
     * is at least half the length of longtext?
     * Closure, but does not reference any external variables.
     * @param {string} longtext Longer string.
     * @param {string} shorttext Shorter string.
     * @param {number} i Start index of quarter length substring within longtext.
     * @return {Array.<string>} Five element Array, containing the prefix of
     *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
     *     of shorttext and the common middle.  Or null if there was no match.
     * @private
     */
  		function diffHalfMatchI(longtext, shorttext, i) {
  			var seed, j, bestCommon, prefixLength, suffixLength, bestLongtextA, bestLongtextB, bestShorttextA, bestShorttextB;

  			// Start with a 1/4 length substring at position i as a seed.
  			seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
  			j = -1;
  			bestCommon = "";
  			while ((j = shorttext.indexOf(seed, j + 1)) !== -1) {
  				prefixLength = dmp.diffCommonPrefix(longtext.substring(i), shorttext.substring(j));
  				suffixLength = dmp.diffCommonSuffix(longtext.substring(0, i), shorttext.substring(0, j));
  				if (bestCommon.length < suffixLength + prefixLength) {
  					bestCommon = shorttext.substring(j - suffixLength, j) + shorttext.substring(j, j + prefixLength);
  					bestLongtextA = longtext.substring(0, i - suffixLength);
  					bestLongtextB = longtext.substring(i + prefixLength);
  					bestShorttextA = shorttext.substring(0, j - suffixLength);
  					bestShorttextB = shorttext.substring(j + prefixLength);
  				}
  			}
  			if (bestCommon.length * 2 >= longtext.length) {
  				return [bestLongtextA, bestLongtextB, bestShorttextA, bestShorttextB, bestCommon];
  			} else {
  				return null;
  			}
  		}

  		// First check if the second quarter is the seed for a half-match.
  		hm1 = diffHalfMatchI(longtext, shorttext, Math.ceil(longtext.length / 4));

  		// Check again based on the third quarter.
  		hm2 = diffHalfMatchI(longtext, shorttext, Math.ceil(longtext.length / 2));
  		if (!hm1 && !hm2) {
  			return null;
  		} else if (!hm2) {
  			hm = hm1;
  		} else if (!hm1) {
  			hm = hm2;
  		} else {

  			// Both matched.  Select the longest.
  			hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  		}

  		// A half-match was found, sort out the return data.
  		if (text1.length > text2.length) {
  			text1A = hm[0];
  			text1B = hm[1];
  			text2A = hm[2];
  			text2B = hm[3];
  		} else {
  			text2A = hm[0];
  			text2B = hm[1];
  			text1A = hm[2];
  			text1B = hm[3];
  		}
  		midCommon = hm[4];
  		return [text1A, text1B, text2A, text2B, midCommon];
  	};

  	/**
    * Do a quick line-level diff on both strings, then rediff the parts for
    * greater accuracy.
    * This speedup can produce non-minimal diffs.
    * @param {string} text1 Old string to be diffed.
    * @param {string} text2 New string to be diffed.
    * @param {number} deadline Time when the diff should be complete by.
    * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
    * @private
    */
  	DiffMatchPatch.prototype.diffLineMode = function (text1, text2, deadline) {
  		var a, diffs, linearray, pointer, countInsert, countDelete, textInsert, textDelete, j;

  		// Scan the text on a line-by-line basis first.
  		a = this.diffLinesToChars(text1, text2);
  		text1 = a.chars1;
  		text2 = a.chars2;
  		linearray = a.lineArray;

  		diffs = this.DiffMain(text1, text2, false, deadline);

  		// Convert the diff back to original text.
  		this.diffCharsToLines(diffs, linearray);

  		// Eliminate freak matches (e.g. blank lines)
  		this.diffCleanupSemantic(diffs);

  		// Rediff any replacement blocks, this time character-by-character.
  		// Add a dummy entry at the end.
  		diffs.push([DIFF_EQUAL, ""]);
  		pointer = 0;
  		countDelete = 0;
  		countInsert = 0;
  		textDelete = "";
  		textInsert = "";
  		while (pointer < diffs.length) {
  			switch (diffs[pointer][0]) {
  				case DIFF_INSERT:
  					countInsert++;
  					textInsert += diffs[pointer][1];
  					break;
  				case DIFF_DELETE:
  					countDelete++;
  					textDelete += diffs[pointer][1];
  					break;
  				case DIFF_EQUAL:

  					// Upon reaching an equality, check for prior redundancies.
  					if (countDelete >= 1 && countInsert >= 1) {

  						// Delete the offending records and add the merged ones.
  						diffs.splice(pointer - countDelete - countInsert, countDelete + countInsert);
  						pointer = pointer - countDelete - countInsert;
  						a = this.DiffMain(textDelete, textInsert, false, deadline);
  						for (j = a.length - 1; j >= 0; j--) {
  							diffs.splice(pointer, 0, a[j]);
  						}
  						pointer = pointer + a.length;
  					}
  					countInsert = 0;
  					countDelete = 0;
  					textDelete = "";
  					textInsert = "";
  					break;
  			}
  			pointer++;
  		}
  		diffs.pop(); // Remove the dummy entry at the end.

  		return diffs;
  	};

  	/**
    * Find the 'middle snake' of a diff, split the problem in two
    * and return the recursively constructed diff.
    * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
    * @param {string} text1 Old string to be diffed.
    * @param {string} text2 New string to be diffed.
    * @param {number} deadline Time at which to bail if not yet complete.
    * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
    * @private
    */
  	DiffMatchPatch.prototype.diffBisect = function (text1, text2, deadline) {
  		var text1Length, text2Length, maxD, vOffset, vLength, v1, v2, x, delta, front, k1start, k1end, k2start, k2end, k2Offset, k1Offset, x1, x2, y1, y2, d, k1, k2;

  		// Cache the text lengths to prevent multiple calls.
  		text1Length = text1.length;
  		text2Length = text2.length;
  		maxD = Math.ceil((text1Length + text2Length) / 2);
  		vOffset = maxD;
  		vLength = 2 * maxD;
  		v1 = new Array(vLength);
  		v2 = new Array(vLength);

  		// Setting all elements to -1 is faster in Chrome & Firefox than mixing
  		// integers and undefined.
  		for (x = 0; x < vLength; x++) {
  			v1[x] = -1;
  			v2[x] = -1;
  		}
  		v1[vOffset + 1] = 0;
  		v2[vOffset + 1] = 0;
  		delta = text1Length - text2Length;

  		// If the total number of characters is odd, then the front path will collide
  		// with the reverse path.
  		front = delta % 2 !== 0;

  		// Offsets for start and end of k loop.
  		// Prevents mapping of space beyond the grid.
  		k1start = 0;
  		k1end = 0;
  		k2start = 0;
  		k2end = 0;
  		for (d = 0; d < maxD; d++) {

  			// Bail out if deadline is reached.
  			if (new Date().getTime() > deadline) {
  				break;
  			}

  			// Walk the front path one step.
  			for (k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
  				k1Offset = vOffset + k1;
  				if (k1 === -d || k1 !== d && v1[k1Offset - 1] < v1[k1Offset + 1]) {
  					x1 = v1[k1Offset + 1];
  				} else {
  					x1 = v1[k1Offset - 1] + 1;
  				}
  				y1 = x1 - k1;
  				while (x1 < text1Length && y1 < text2Length && text1.charAt(x1) === text2.charAt(y1)) {
  					x1++;
  					y1++;
  				}
  				v1[k1Offset] = x1;
  				if (x1 > text1Length) {

  					// Ran off the right of the graph.
  					k1end += 2;
  				} else if (y1 > text2Length) {

  					// Ran off the bottom of the graph.
  					k1start += 2;
  				} else if (front) {
  					k2Offset = vOffset + delta - k1;
  					if (k2Offset >= 0 && k2Offset < vLength && v2[k2Offset] !== -1) {

  						// Mirror x2 onto top-left coordinate system.
  						x2 = text1Length - v2[k2Offset];
  						if (x1 >= x2) {

  							// Overlap detected.
  							return this.diffBisectSplit(text1, text2, x1, y1, deadline);
  						}
  					}
  				}
  			}

  			// Walk the reverse path one step.
  			for (k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
  				k2Offset = vOffset + k2;
  				if (k2 === -d || k2 !== d && v2[k2Offset - 1] < v2[k2Offset + 1]) {
  					x2 = v2[k2Offset + 1];
  				} else {
  					x2 = v2[k2Offset - 1] + 1;
  				}
  				y2 = x2 - k2;
  				while (x2 < text1Length && y2 < text2Length && text1.charAt(text1Length - x2 - 1) === text2.charAt(text2Length - y2 - 1)) {
  					x2++;
  					y2++;
  				}
  				v2[k2Offset] = x2;
  				if (x2 > text1Length) {

  					// Ran off the left of the graph.
  					k2end += 2;
  				} else if (y2 > text2Length) {

  					// Ran off the top of the graph.
  					k2start += 2;
  				} else if (!front) {
  					k1Offset = vOffset + delta - k2;
  					if (k1Offset >= 0 && k1Offset < vLength && v1[k1Offset] !== -1) {
  						x1 = v1[k1Offset];
  						y1 = vOffset + x1 - k1Offset;

  						// Mirror x2 onto top-left coordinate system.
  						x2 = text1Length - x2;
  						if (x1 >= x2) {

  							// Overlap detected.
  							return this.diffBisectSplit(text1, text2, x1, y1, deadline);
  						}
  					}
  				}
  			}
  		}

  		// Diff took too long and hit the deadline or
  		// number of diffs equals number of characters, no commonality at all.
  		return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  	};

  	/**
    * Given the location of the 'middle snake', split the diff in two parts
    * and recurse.
    * @param {string} text1 Old string to be diffed.
    * @param {string} text2 New string to be diffed.
    * @param {number} x Index of split point in text1.
    * @param {number} y Index of split point in text2.
    * @param {number} deadline Time at which to bail if not yet complete.
    * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
    * @private
    */
  	DiffMatchPatch.prototype.diffBisectSplit = function (text1, text2, x, y, deadline) {
  		var text1a, text1b, text2a, text2b, diffs, diffsb;
  		text1a = text1.substring(0, x);
  		text2a = text2.substring(0, y);
  		text1b = text1.substring(x);
  		text2b = text2.substring(y);

  		// Compute both diffs serially.
  		diffs = this.DiffMain(text1a, text2a, false, deadline);
  		diffsb = this.DiffMain(text1b, text2b, false, deadline);

  		return diffs.concat(diffsb);
  	};

  	/**
    * Reduce the number of edits by eliminating semantically trivial equalities.
    * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
    */
  	DiffMatchPatch.prototype.diffCleanupSemantic = function (diffs) {
  		var changes, equalities, equalitiesLength, lastequality, pointer, lengthInsertions2, lengthDeletions2, lengthInsertions1, lengthDeletions1, deletion, insertion, overlapLength1, overlapLength2;
  		changes = false;
  		equalities = []; // Stack of indices where equalities are found.
  		equalitiesLength = 0; // Keeping our own length var is faster in JS.
  		/** @type {?string} */
  		lastequality = null;

  		// Always equal to diffs[equalities[equalitiesLength - 1]][1]
  		pointer = 0; // Index of current position.

  		// Number of characters that changed prior to the equality.
  		lengthInsertions1 = 0;
  		lengthDeletions1 = 0;

  		// Number of characters that changed after the equality.
  		lengthInsertions2 = 0;
  		lengthDeletions2 = 0;
  		while (pointer < diffs.length) {
  			if (diffs[pointer][0] === DIFF_EQUAL) {
  				// Equality found.
  				equalities[equalitiesLength++] = pointer;
  				lengthInsertions1 = lengthInsertions2;
  				lengthDeletions1 = lengthDeletions2;
  				lengthInsertions2 = 0;
  				lengthDeletions2 = 0;
  				lastequality = diffs[pointer][1];
  			} else {
  				// An insertion or deletion.
  				if (diffs[pointer][0] === DIFF_INSERT) {
  					lengthInsertions2 += diffs[pointer][1].length;
  				} else {
  					lengthDeletions2 += diffs[pointer][1].length;
  				}

  				// Eliminate an equality that is smaller or equal to the edits on both
  				// sides of it.
  				if (lastequality && lastequality.length <= Math.max(lengthInsertions1, lengthDeletions1) && lastequality.length <= Math.max(lengthInsertions2, lengthDeletions2)) {

  					// Duplicate record.
  					diffs.splice(equalities[equalitiesLength - 1], 0, [DIFF_DELETE, lastequality]);

  					// Change second copy to insert.
  					diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;

  					// Throw away the equality we just deleted.
  					equalitiesLength--;

  					// Throw away the previous equality (it needs to be reevaluated).
  					equalitiesLength--;
  					pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;

  					// Reset the counters.
  					lengthInsertions1 = 0;
  					lengthDeletions1 = 0;
  					lengthInsertions2 = 0;
  					lengthDeletions2 = 0;
  					lastequality = null;
  					changes = true;
  				}
  			}
  			pointer++;
  		}

  		// Normalize the diff.
  		if (changes) {
  			this.diffCleanupMerge(diffs);
  		}

  		// Find any overlaps between deletions and insertions.
  		// e.g: <del>abcxxx</del><ins>xxxdef</ins>
  		//   -> <del>abc</del>xxx<ins>def</ins>
  		// e.g: <del>xxxabc</del><ins>defxxx</ins>
  		//   -> <ins>def</ins>xxx<del>abc</del>
  		// Only extract an overlap if it is as big as the edit ahead or behind it.
  		pointer = 1;
  		while (pointer < diffs.length) {
  			if (diffs[pointer - 1][0] === DIFF_DELETE && diffs[pointer][0] === DIFF_INSERT) {
  				deletion = diffs[pointer - 1][1];
  				insertion = diffs[pointer][1];
  				overlapLength1 = this.diffCommonOverlap(deletion, insertion);
  				overlapLength2 = this.diffCommonOverlap(insertion, deletion);
  				if (overlapLength1 >= overlapLength2) {
  					if (overlapLength1 >= deletion.length / 2 || overlapLength1 >= insertion.length / 2) {

  						// Overlap found.  Insert an equality and trim the surrounding edits.
  						diffs.splice(pointer, 0, [DIFF_EQUAL, insertion.substring(0, overlapLength1)]);
  						diffs[pointer - 1][1] = deletion.substring(0, deletion.length - overlapLength1);
  						diffs[pointer + 1][1] = insertion.substring(overlapLength1);
  						pointer++;
  					}
  				} else {
  					if (overlapLength2 >= deletion.length / 2 || overlapLength2 >= insertion.length / 2) {

  						// Reverse overlap found.
  						// Insert an equality and swap and trim the surrounding edits.
  						diffs.splice(pointer, 0, [DIFF_EQUAL, deletion.substring(0, overlapLength2)]);

  						diffs[pointer - 1][0] = DIFF_INSERT;
  						diffs[pointer - 1][1] = insertion.substring(0, insertion.length - overlapLength2);
  						diffs[pointer + 1][0] = DIFF_DELETE;
  						diffs[pointer + 1][1] = deletion.substring(overlapLength2);
  						pointer++;
  					}
  				}
  				pointer++;
  			}
  			pointer++;
  		}
  	};

  	/**
    * Determine if the suffix of one string is the prefix of another.
    * @param {string} text1 First string.
    * @param {string} text2 Second string.
    * @return {number} The number of characters common to the end of the first
    *     string and the start of the second string.
    * @private
    */
  	DiffMatchPatch.prototype.diffCommonOverlap = function (text1, text2) {
  		var text1Length, text2Length, textLength, best, length, pattern, found;

  		// Cache the text lengths to prevent multiple calls.
  		text1Length = text1.length;
  		text2Length = text2.length;

  		// Eliminate the null case.
  		if (text1Length === 0 || text2Length === 0) {
  			return 0;
  		}

  		// Truncate the longer string.
  		if (text1Length > text2Length) {
  			text1 = text1.substring(text1Length - text2Length);
  		} else if (text1Length < text2Length) {
  			text2 = text2.substring(0, text1Length);
  		}
  		textLength = Math.min(text1Length, text2Length);

  		// Quick check for the worst case.
  		if (text1 === text2) {
  			return textLength;
  		}

  		// Start by looking for a single character match
  		// and increase length until no match is found.
  		// Performance analysis: https://neil.fraser.name/news/2010/11/04/
  		best = 0;
  		length = 1;
  		while (true) {
  			pattern = text1.substring(textLength - length);
  			found = text2.indexOf(pattern);
  			if (found === -1) {
  				return best;
  			}
  			length += found;
  			if (found === 0 || text1.substring(textLength - length) === text2.substring(0, length)) {
  				best = length;
  				length++;
  			}
  		}
  	};

  	/**
    * Split two texts into an array of strings.  Reduce the texts to a string of
    * hashes where each Unicode character represents one line.
    * @param {string} text1 First string.
    * @param {string} text2 Second string.
    * @return {{chars1: string, chars2: string, lineArray: !Array.<string>}}
    *     An object containing the encoded text1, the encoded text2 and
    *     the array of unique strings.
    *     The zeroth element of the array of unique strings is intentionally blank.
    * @private
    */
  	DiffMatchPatch.prototype.diffLinesToChars = function (text1, text2) {
  		var lineArray, lineHash, chars1, chars2;
  		lineArray = []; // E.g. lineArray[4] === 'Hello\n'
  		lineHash = {}; // E.g. lineHash['Hello\n'] === 4

  		// '\x00' is a valid character, but various debuggers don't like it.
  		// So we'll insert a junk entry to avoid generating a null character.
  		lineArray[0] = "";

  		/**
     * Split a text into an array of strings.  Reduce the texts to a string of
     * hashes where each Unicode character represents one line.
     * Modifies linearray and linehash through being a closure.
     * @param {string} text String to encode.
     * @return {string} Encoded string.
     * @private
     */
  		function diffLinesToCharsMunge(text) {
  			var chars, lineStart, lineEnd, lineArrayLength, line;
  			chars = "";

  			// Walk the text, pulling out a substring for each line.
  			// text.split('\n') would would temporarily double our memory footprint.
  			// Modifying text would create many large strings to garbage collect.
  			lineStart = 0;
  			lineEnd = -1;

  			// Keeping our own length variable is faster than looking it up.
  			lineArrayLength = lineArray.length;
  			while (lineEnd < text.length - 1) {
  				lineEnd = text.indexOf("\n", lineStart);
  				if (lineEnd === -1) {
  					lineEnd = text.length - 1;
  				}
  				line = text.substring(lineStart, lineEnd + 1);
  				lineStart = lineEnd + 1;

  				var lineHashExists = lineHash.hasOwnProperty ? lineHash.hasOwnProperty(line) : lineHash[line] !== undefined;

  				if (lineHashExists) {
  					chars += String.fromCharCode(lineHash[line]);
  				} else {
  					chars += String.fromCharCode(lineArrayLength);
  					lineHash[line] = lineArrayLength;
  					lineArray[lineArrayLength++] = line;
  				}
  			}
  			return chars;
  		}

  		chars1 = diffLinesToCharsMunge(text1);
  		chars2 = diffLinesToCharsMunge(text2);
  		return {
  			chars1: chars1,
  			chars2: chars2,
  			lineArray: lineArray
  		};
  	};

  	/**
    * Rehydrate the text in a diff from a string of line hashes to real lines of
    * text.
    * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
    * @param {!Array.<string>} lineArray Array of unique strings.
    * @private
    */
  	DiffMatchPatch.prototype.diffCharsToLines = function (diffs, lineArray) {
  		var x, chars, text, y;
  		for (x = 0; x < diffs.length; x++) {
  			chars = diffs[x][1];
  			text = [];
  			for (y = 0; y < chars.length; y++) {
  				text[y] = lineArray[chars.charCodeAt(y)];
  			}
  			diffs[x][1] = text.join("");
  		}
  	};

  	/**
    * Reorder and merge like edit sections.  Merge equalities.
    * Any edit section can move as long as it doesn't cross an equality.
    * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
    */
  	DiffMatchPatch.prototype.diffCleanupMerge = function (diffs) {
  		var pointer, countDelete, countInsert, textInsert, textDelete, commonlength, changes, diffPointer, position;
  		diffs.push([DIFF_EQUAL, ""]); // Add a dummy entry at the end.
  		pointer = 0;
  		countDelete = 0;
  		countInsert = 0;
  		textDelete = "";
  		textInsert = "";

  		while (pointer < diffs.length) {
  			switch (diffs[pointer][0]) {
  				case DIFF_INSERT:
  					countInsert++;
  					textInsert += diffs[pointer][1];
  					pointer++;
  					break;
  				case DIFF_DELETE:
  					countDelete++;
  					textDelete += diffs[pointer][1];
  					pointer++;
  					break;
  				case DIFF_EQUAL:

  					// Upon reaching an equality, check for prior redundancies.
  					if (countDelete + countInsert > 1) {
  						if (countDelete !== 0 && countInsert !== 0) {

  							// Factor out any common prefixes.
  							commonlength = this.diffCommonPrefix(textInsert, textDelete);
  							if (commonlength !== 0) {
  								if (pointer - countDelete - countInsert > 0 && diffs[pointer - countDelete - countInsert - 1][0] === DIFF_EQUAL) {
  									diffs[pointer - countDelete - countInsert - 1][1] += textInsert.substring(0, commonlength);
  								} else {
  									diffs.splice(0, 0, [DIFF_EQUAL, textInsert.substring(0, commonlength)]);
  									pointer++;
  								}
  								textInsert = textInsert.substring(commonlength);
  								textDelete = textDelete.substring(commonlength);
  							}

  							// Factor out any common suffixies.
  							commonlength = this.diffCommonSuffix(textInsert, textDelete);
  							if (commonlength !== 0) {
  								diffs[pointer][1] = textInsert.substring(textInsert.length - commonlength) + diffs[pointer][1];
  								textInsert = textInsert.substring(0, textInsert.length - commonlength);
  								textDelete = textDelete.substring(0, textDelete.length - commonlength);
  							}
  						}

  						// Delete the offending records and add the merged ones.
  						if (countDelete === 0) {
  							diffs.splice(pointer - countInsert, countDelete + countInsert, [DIFF_INSERT, textInsert]);
  						} else if (countInsert === 0) {
  							diffs.splice(pointer - countDelete, countDelete + countInsert, [DIFF_DELETE, textDelete]);
  						} else {
  							diffs.splice(pointer - countDelete - countInsert, countDelete + countInsert, [DIFF_DELETE, textDelete], [DIFF_INSERT, textInsert]);
  						}
  						pointer = pointer - countDelete - countInsert + (countDelete ? 1 : 0) + (countInsert ? 1 : 0) + 1;
  					} else if (pointer !== 0 && diffs[pointer - 1][0] === DIFF_EQUAL) {

  						// Merge this equality with the previous one.
  						diffs[pointer - 1][1] += diffs[pointer][1];
  						diffs.splice(pointer, 1);
  					} else {
  						pointer++;
  					}
  					countInsert = 0;
  					countDelete = 0;
  					textDelete = "";
  					textInsert = "";
  					break;
  			}
  		}
  		if (diffs[diffs.length - 1][1] === "") {
  			diffs.pop(); // Remove the dummy entry at the end.
  		}

  		// Second pass: look for single edits surrounded on both sides by equalities
  		// which can be shifted sideways to eliminate an equality.
  		// e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  		changes = false;
  		pointer = 1;

  		// Intentionally ignore the first and last element (don't need checking).
  		while (pointer < diffs.length - 1) {
  			if (diffs[pointer - 1][0] === DIFF_EQUAL && diffs[pointer + 1][0] === DIFF_EQUAL) {

  				diffPointer = diffs[pointer][1];
  				position = diffPointer.substring(diffPointer.length - diffs[pointer - 1][1].length);

  				// This is a single edit surrounded by equalities.
  				if (position === diffs[pointer - 1][1]) {

  					// Shift the edit over the previous equality.
  					diffs[pointer][1] = diffs[pointer - 1][1] + diffs[pointer][1].substring(0, diffs[pointer][1].length - diffs[pointer - 1][1].length);
  					diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
  					diffs.splice(pointer - 1, 1);
  					changes = true;
  				} else if (diffPointer.substring(0, diffs[pointer + 1][1].length) === diffs[pointer + 1][1]) {

  					// Shift the edit over the next equality.
  					diffs[pointer - 1][1] += diffs[pointer + 1][1];
  					diffs[pointer][1] = diffs[pointer][1].substring(diffs[pointer + 1][1].length) + diffs[pointer + 1][1];
  					diffs.splice(pointer + 1, 1);
  					changes = true;
  				}
  			}
  			pointer++;
  		}

  		// If shifts were made, the diff needs reordering and another shift sweep.
  		if (changes) {
  			this.diffCleanupMerge(diffs);
  		}
  	};

  	return function (o, n) {
  		var diff, output, text;
  		diff = new DiffMatchPatch();
  		output = diff.DiffMain(o, n);
  		diff.diffCleanupEfficiency(output);
  		text = diff.diffPrettyHtml(output);

  		return text;
  	};
  }();

}((function() { return this; }())));

},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ThriftTest_types_1 = require("./gen-js/ThriftTest_types");
require("./gen-js/ThriftTest");
var Int64 = require("node-int64");
var JSONInt64 = require("json-int64");
var QUnit = require("./qunit");
const transport = new Thrift.Transport("/service");
const protocol = new Thrift.Protocol(transport);
const client = new ThriftTest_types_1.ThriftTest.ThriftTestClient(protocol);
const int64_2_pow_60 = new Int64('1000000000000000');
const int64_minus_2_pow_60 = new Int64('f000000000000000');
if (typeof QUnit.log == 'function') {
    QUnit.log(function (details) {
        if (!details.result) {
            console.log('======== FAIL ========');
            console.log('TestName: ' + details.name);
            if (details.message)
                console.log(details.message);
            console.log('Expected: ' + JSONInt64.stringify(details.expected));
            console.log('Actual  : ' + JSONInt64.stringify(details.actual));
            console.log('======================');
        }
    });
}
const stringTest = "Afrikaans, Alemannisch, Aragonés, العربية, مصرى, Asturianu, Aymar aru, Azərbaycan, Башҡорт, Boarisch, Žemaitėška, Беларуская, Беларуская (тарашкевіца), Български, Bamanankan, বাংলা, Brezhoneg, Bosanski, Català, Mìng-dĕ̤ng-ngṳ̄, Нохчийн, Cebuano, ᏣᎳᎩ, Česky, Словѣ́ньскъ / ⰔⰎⰑⰂⰡⰐⰠⰔⰍⰟ, Чӑвашла, Cymraeg, Dansk, Zazaki, ދިވެހިބަސް, Ελληνικά, Emiliàn e rumagnòl, English, Esperanto, Español, Eesti, Euskara, فارسی, Suomi, Võro, Føroyskt, Français, Arpetan, Furlan, Frysk, Gaeilge, 贛語, Gàidhlig, Galego, Avañe'ẽ, ગુજરાતી, Gaelg, עברית, हिन्दी, Fiji Hindi, Hrvatski, Kreyòl ayisyen, Magyar, Հայերեն, Interlingua, Bahasa Indonesia, Ilokano, Ido, Íslenska, Italiano, 日本語, Lojban, Basa Jawa, ქართული, Kongo, Kalaallisut, ಕನ್ನಡ, 한국어, Къарачай-Малкъар, Ripoarisch, Kurdî, Коми, Kernewek, Кыргызча, Latina, Ladino, Lëtzebuergesch, Limburgs, Lingála, ລາວ, Lietuvių, Latviešu, Basa Banyumasan, Malagasy, Македонски, മലയാളം, मराठी, Bahasa Melayu, مازِرونی, Nnapulitano, Nedersaksisch, नेपाल भाषा, Nederlands, ‪Norsk (nynorsk)‬, ‪Norsk (bokmål)‬, Nouormand, Diné bizaad, Occitan, Иронау, Papiamentu, Deitsch, Norfuk / Pitkern, Polski, پنجابی, پښتو, Português, Runa Simi, Rumantsch, Romani, Română, Русский, Саха тыла, Sardu, Sicilianu, Scots, Sámegiella, Simple English, Slovenčina, Slovenščina, Српски / Srpski, Seeltersk, Svenska, Kiswahili, தமிழ், తెలుగు, Тоҷикӣ, ไทย, Türkmençe, Tagalog, Türkçe, Татарча/Tatarça, Українська, اردو, Tiếng Việt, Volapük, Walon, Winaray, 吴语, isiXhosa, ייִדיש, Yorùbá, Zeêuws, 中文, Bân-lâm-gú, 粵語";
function checkRecursively(assert, map1, map2) {
    if (typeof map1 !== 'function' && typeof map2 !== 'function') {
        if (!map1 || typeof map1 !== 'object') {
            assert.equal(map1, map2);
        }
        else {
            for (let key in map1) {
                checkRecursively(assert, map1[key], map2[key]);
            }
        }
    }
}
QUnit.module('Base Types');
QUnit.test('Void', function (assert) {
    assert.equal(client.testVoid(), undefined);
});
QUnit.test('Binary (String)', function (assert) {
    let binary = '';
    for (let v = 255; v >= 0; --v) {
        binary += String.fromCharCode(v);
    }
    assert.equal(client.testBinary(binary), binary);
});
QUnit.test('Binary (Uint8Array)', function (assert) {
    let binary = '';
    for (let v = 255; v >= 0; --v) {
        binary += String.fromCharCode(v);
    }
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; ++i) {
        arr[i] = binary[i].charCodeAt(0);
    }
    const hexEncodedString = Array.from(arr, function (byte) {
        return String.fromCharCode(byte);
    }).join('');
    assert.equal(client.testBinary(hexEncodedString), binary);
});
QUnit.test('String', function (assert) {
    assert.equal(client.testString(''), '');
    assert.equal(client.testString(stringTest), stringTest);
    const specialCharacters = 'quote: \" backslash:' +
        ' forwardslash-escaped: \/ ' +
        ' backspace: \b formfeed: \f newline: \n return: \r tab: ' +
        ' now-all-of-them-together: "\\\/\b\n\r\t' +
        ' now-a-bunch-of-junk: !@#$%&()(&%$#{}{}<><><';
    assert.equal(client.testString(specialCharacters), specialCharacters);
});
QUnit.test('Double', function (assert) {
    assert.equal(client.testDouble(0), 0);
    assert.equal(client.testDouble(-1), -1);
    assert.equal(client.testDouble(3.14), 3.14);
    assert.equal(client.testDouble(Math.pow(2, 60)), Math.pow(2, 60));
});
QUnit.test('Byte', function (assert) {
    assert.equal(client.testByte(0), 0);
    assert.equal(client.testByte(0x01), 0x01);
});
QUnit.test('I32', function (assert) {
    assert.equal(client.testI32(0), 0);
    assert.equal(client.testI32(Math.pow(2, 30)), Math.pow(2, 30));
    assert.equal(client.testI32(-Math.pow(2, 30)), -Math.pow(2, 30));
});
QUnit.test('I64', function (assert) {
    assert.equal(client.testI64(new Int64(0)), 0);
    let int64_2_pow_60_result = client.testI64(int64_2_pow_60);
    assert.ok(int64_2_pow_60.equals(int64_2_pow_60_result));
    let int64_minus_2_pow_60_result = client.testI64(int64_minus_2_pow_60);
    assert.ok(int64_minus_2_pow_60.equals(int64_minus_2_pow_60_result));
});
QUnit.module('Structured Types');
QUnit.test('Struct', function (assert) {
    const structTestInput = new ThriftTest_types_1.ThriftTest.Xtruct();
    structTestInput.string_thing = 'worked';
    structTestInput.byte_thing = 0x01;
    structTestInput.i32_thing = Math.pow(2, 30);
    structTestInput.i64_thing = int64_2_pow_60;
    const structTestOutput = client.testStruct(structTestInput);
    assert.equal(structTestOutput.string_thing, structTestInput.string_thing);
    assert.equal(structTestOutput.byte_thing, structTestInput.byte_thing);
    assert.equal(structTestOutput.i32_thing, structTestInput.i32_thing);
    assert.ok(structTestOutput.i64_thing.equals(structTestInput.i64_thing));
    assert.ok(structTestInput.i64_thing.equals(structTestOutput.i64_thing));
    assert.equal(JSONInt64.stringify(structTestOutput), JSONInt64.stringify(structTestInput));
});
QUnit.test('Nest', function (assert) {
    const xtrTestInput = new ThriftTest_types_1.ThriftTest.Xtruct();
    xtrTestInput.string_thing = 'worked';
    xtrTestInput.byte_thing = 0x01;
    xtrTestInput.i32_thing = Math.pow(2, 30);
    xtrTestInput.i64_thing = int64_2_pow_60;
    const nestTestInput = new ThriftTest_types_1.ThriftTest.Xtruct2();
    nestTestInput.byte_thing = 0x02;
    nestTestInput.struct_thing = xtrTestInput;
    nestTestInput.i32_thing = Math.pow(2, 15);
    const nestTestOutput = client.testNest(nestTestInput);
    assert.equal(nestTestOutput.byte_thing, nestTestInput.byte_thing);
    assert.equal(nestTestOutput.struct_thing.string_thing, nestTestInput.struct_thing.string_thing);
    assert.equal(nestTestOutput.struct_thing.byte_thing, nestTestInput.struct_thing.byte_thing);
    assert.equal(nestTestOutput.struct_thing.i32_thing, nestTestInput.struct_thing.i32_thing);
    assert.ok(nestTestOutput.struct_thing.i64_thing.equals(nestTestInput.struct_thing.i64_thing));
    assert.equal(nestTestOutput.i32_thing, nestTestInput.i32_thing);
    assert.equal(JSONInt64.stringify(nestTestOutput), JSONInt64.stringify(nestTestInput));
});
QUnit.test('Map', function (assert) {
    const mapTestInput = { 7: 77, 8: 88, 9: 99 };
    const mapTestOutput = client.testMap(mapTestInput);
    for (let key in mapTestOutput) {
        assert.equal(mapTestOutput[key], mapTestInput[key]);
    }
});
QUnit.test('StringMap', function (assert) {
    const mapTestInput = {
        'a': '123', 'a b': 'with spaces ', 'same': 'same', '0': 'numeric key',
        'longValue': stringTest, stringTest: 'long key'
    };
    const mapTestOutput = client.testStringMap(mapTestInput);
    for (let key in mapTestOutput) {
        assert.equal(mapTestOutput[key], mapTestInput[key]);
    }
});
QUnit.test('Set', function (assert) {
    const setTestInput = [1, 2, 3];
    assert.ok(client.testSet(setTestInput), setTestInput);
});
QUnit.test('List', function (assert) {
    const listTestInput = [1, 2, 3];
    assert.ok(client.testList(listTestInput), listTestInput);
});
QUnit.test('Enum', function (assert) {
    assert.equal(client.testEnum(ThriftTest_types_1.ThriftTest.Numberz.ONE), ThriftTest_types_1.ThriftTest.Numberz.ONE);
});
QUnit.test('TypeDef', function (assert) {
    assert.equal(client.testTypedef(new Int64(69)), 69);
});
QUnit.module('deeper!');
QUnit.test('MapMap', function (assert) {
    const mapMapTestExpectedResult = {
        '4': { '1': 1, '2': 2, '3': 3, '4': 4 },
        '-4': { '-4': -4, '-3': -3, '-2': -2, '-1': -1 }
    };
    const mapMapTestOutput = client.testMapMap(1);
    for (let key in mapMapTestOutput) {
        for (let key2 in mapMapTestOutput[key]) {
            assert.equal(mapMapTestOutput[key][key2], mapMapTestExpectedResult[key][key2]);
        }
    }
    checkRecursively(assert, mapMapTestOutput, mapMapTestExpectedResult);
});
QUnit.module('Exception');
QUnit.test('Xception', function (assert) {
    assert.expect(2);
    const done = assert.async();
    try {
        client.testException('Xception');
        assert.ok(false);
    }
    catch (e) {
        assert.equal(e.errorCode, 1001);
        assert.equal(e.message, 'Xception');
        done();
    }
});
QUnit.test('no Exception', function (assert) {
    assert.expect(1);
    try {
        client.testException('no Exception');
        assert.ok(true);
    }
    catch (e) {
        assert.ok(false);
    }
});
QUnit.test('TException', function (assert) {
    assert.expect(1);
    try {
        client.testException('TException');
    }
    catch (e) {
    }
    assert.ok(true);
});
QUnit.module('Insanity');
const crazy = {
    'userMap': { '5': new Int64(5), '8': new Int64(8) },
    'xtructs': [{
            'string_thing': 'Goodbye4',
            'byte_thing': 4,
            'i32_thing': 4,
            'i64_thing': new Int64(4)
        },
        {
            'string_thing': 'Hello2',
            'byte_thing': 2,
            'i32_thing': 2,
            'i64_thing': new Int64(2)
        }]
};
QUnit.test('testInsanity', function (assert) {
    const insanity = {
        '1': {
            '2': crazy,
            '3': crazy
        },
        '2': { '6': new ThriftTest_types_1.ThriftTest.Insanity() }
    };
    const res = client.testInsanity(new ThriftTest_types_1.ThriftTest.Insanity(crazy));
    assert.ok(res, JSONInt64.stringify(res));
    assert.ok(insanity, JSONInt64.stringify(insanity));
    checkRecursively(assert, res, insanity);
});
QUnit.module('Async');
QUnit.test('Double', function (assert) {
    assert.expect(1);
    const done = assert.async();
    client.testDouble(3.14159265, function (result) {
        assert.equal(result, 3.14159265);
        done();
    });
});
QUnit.test('Byte', function (assert) {
    assert.expect(1);
    const done = assert.async();
    client.testByte(0x01, function (result) {
        assert.equal(result, 0x01);
        done();
    });
});
QUnit.test('I32', function (assert) {
    assert.expect(2);
    const done = assert.async(2);
    client.testI32(Math.pow(2, 30), function (result) {
        assert.equal(result, Math.pow(2, 30));
        done();
    });
    client.testI32(Math.pow(-2, 31), function (result) {
        assert.equal(result, Math.pow(-2, 31));
        done();
    });
});
QUnit.test('I64', function (assert) {
    assert.expect(2);
    const done = assert.async(2);
    client.testI64(int64_2_pow_60, function (result) {
        assert.ok(int64_2_pow_60.equals(result));
        done();
    });
    client.testI64(int64_minus_2_pow_60, function (result) {
        assert.ok(int64_minus_2_pow_60.equals(result));
        done();
    });
});

},{"./gen-js/ThriftTest":9,"./gen-js/ThriftTest_types":10,"./qunit":11,"json-int64":4,"node-int64":8}]},{},[12])(12)
});
