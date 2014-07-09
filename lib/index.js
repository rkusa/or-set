'use strict'

var uuid = require('node-uuid')

var OrSet = module.exports = function(pairs) {
  Object.defineProperties(this, {
    _elements: { value: [] },
    _utags:    { value: Object.create(null) }
  })

  if (pairs) this.reset(pairs)
}

OrSet.prototype = Object.create({

  get size() {
    return this._elements.length
  },

  has: function(e) {
    return this._elements.indexOf(e) > -1
  },

  add: function(e, u) {
    var utag, index

    // downstream
    if (u) {
      utag  = u
      index = this._elements.indexOf(e)
      if (index === -1) {
        index = this._elements.push(e) - 1
      }
    }
    // local
    else {
      if (this.has(e)) return
      utag = uuid.v4()
      index = this._elements.push(e) - 1
    }

    this._utags[utag] = index
  },

  remove: function(e, u) {
    var index

    // downstream
    if (u) {
      if (!(u in this._utags)) return
      index = this._utags[u]
      delete this._utags[u]
      for (var utag in this._utags) {
        if (this._utags[utag] === index) {
          return
        }
      }
    }
    // local
    else {
      // var remove = []
      for (var utag in this._utags) {
        var idx = this._utags[utag]
        if (this._elements[idx] === e) {
          // remove.push({
          //   e: this._elements[index],
          //   u: utag
          // })
          delete this._utags[utag]
          index = idx
        }
      }
    }

    if (index >= 0) {
      this._elements.splice(index, 1)
      for (var utag in this._utags) {
        if (this._utags[utag] > index) {
          this._utags[utag]--
        }
      }
    }
  },

  reset: function(pairs) {
    // empty
    for (var u in this.set) {
      delete this.set[u]
    }

    // add pairs, as long as they represented as follows:
    // {
    //   e: ..., // element
    //   u: ...  // unique tag
    // }
    pairs.forEach(function(pair) {
      if (!pair.u || pair.e === undefined) return

      var length = this._elements.push(pair.e)
      this._utags[pair.u] = length - 1
    }, this)
  }

}, { constructor: { value: OrSet } })

var arrayMethods = ['forEach', 'filter', 'map', 'reduce']
arrayMethods.forEach(function(method) {
  OrSet.prototype[method] = function() {
    return Array.prototype[method].apply(this._elements, arguments)
  }
})