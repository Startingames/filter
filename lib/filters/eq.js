// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2015 Patrick Mooney
'use strict'

const util = require('util')
const assert = require('assert-plus')

const helpers = require('../helpers')
const escapeFilterValue = require('../utils/escape-filter-value')
const testValues = require('../utils/test-values')

/// --- API

function EqualityFilter (options) {
  assert.optionalObject(options)
  if (options) {
    assert.string(options.attribute, 'options.attribute')
    this.attribute = options.attribute
    // Prefer Buffers over strings to make filter cloning easier
    if (options.raw) {
      this.raw = options.raw
    } else {
      this.raw = Buffer.from(options.value)
    }
  } else {
    this.raw = Buffer.alloc(0)
  }
}
util.inherits(EqualityFilter, helpers.Filter)
Object.defineProperties(EqualityFilter.prototype, {
  type: {
    get: function getType () { return 'equal' },
    configurable: false
  },
  value: {
    get: function getValue () {
      return (Buffer.isBuffer(this.raw)) ? this.raw.toString() : this.raw
    },
    set: function setValue (val) {
      if (typeof (val) === 'string') {
        this.raw = Buffer.from(val)
      } else if (Buffer.isBuffer(val)) {
        this.raw = Buffer.alloc(val.length)
        val.copy(this.raw)
      } else {
        this.raw = val
      }
    },
    configurable: false
  },
  json: {
    get: function getJson () {
      return {
        type: 'EqualityMatch',
        attribute: this.attribute,
        value: this.value
      }
    },
    configurable: false
  }
})

EqualityFilter.prototype.toString = function toString () {
  let value, decoded, validate
  if (Buffer.isBuffer(this.raw)) {
    value = this.raw
    decoded = this.raw.toString('utf8')
    validate = Buffer.from(decoded, 'utf8')
    /*
     * Use the decoded UTF-8 if it is valid, otherwise fall back to bytes.
     * Since Buffer.compare is missing in older versions of node, a simple
     * length comparison is used as a heuristic.  This can be updated later to
     * a full compare if it is found lacking.
     */
    if (validate.length === this.raw.length) {
      value = decoded
    }
  } else if (typeof (this.raw) === 'string') {
    value = this.raw
  } else {
    throw new Error('invalid value type')
  }
  return ('(' + escapeFilterValue(this.attribute) +
          '=' + escapeFilterValue(value) + ')')
}

EqualityFilter.prototype.matches = function matches (target, strictAttrCase) {
  assert.object(target, 'target')

  const tv = helpers.getAttrValue(target, this.attribute, strictAttrCase)
  const value = this.value

  return testValues({
    rule: function (v) {
      return value === v
    },
    value: tv
  })
}

/// --- Exports

module.exports = EqualityFilter