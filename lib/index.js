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

  get: function(u) {
    if (!(u in this._utags)) {
      return undefined
    }

    return this._elements[this._utags[u]]
  },

  add: function(e, u) {
    var utag, index

    // downstream
    if (u) {
      utag  = u
      index = this._elements.indexOf(e)
      if (index === -1) {
        index = this._elements.push(this._transform(e)) - 1
      }
    }
    // local
    else {
      if (this.has(e)) return
      utag = uuid.v4()
      index = this._elements.push(this._transform(e)) - 1
    }

    this._utags[utag] = index

    if (typeof Object.getNotifier === 'function') {
      Object.getNotifier(this).notify({
        type: 'add', name: utag, value: e
      })
    }
  },

  remove: function(e, u) {
    var index, utag

    // downstream
    if (u) {
      if (!(u in this._utags)) return
      index = this._utags[u]
      delete this._utags[u]

      if (typeof Object.getNotifier === 'function') {
        Object.getNotifier(this).notify({
          type: 'delete', name: u, oldValue: this._elements[index]
        })
      }

      for (utag in this._utags) {
        if (this._utags[utag] === index) {
          return
        }
      }
    }
    // local
    else {
      // var remove = []
      for (utag in this._utags) {
        var idx = this._utags[utag]
        if (this._elements[idx] === e) {
          // remove.push({
          //   e: this._elements[index],
          //   u: utag
          // })
          delete this._utags[utag]
          index = idx

          if (typeof Object.getNotifier === 'function') {
            Object.getNotifier(this).notify({
              type: 'delete', name: utag, oldValue: e
            })
          }
        }
      }
    }

    if (index >= 0) {
      this._elements.splice(index, 1)
      for (utag in this._utags) {
        if (this._utags[utag] > index) {
          this._utags[utag]--
        }
      }
    }
  },

  reset: function(pairs) {
    // empty
    this._elements.length = 0
    for (var u in this._utags) {
      delete this._utags[u]
    }

    // add pairs, represented as follows:
    // [[e, u], [e, u], ...]
    //   e: ..., // element
    //   u: ...  // unique tag
    pairs.forEach(function(pair) {
      if (Array.isArray(pair) && pair.length === 2) {
        var length = this._elements.push(this._transform(pair[0]))
        this._utags[pair[1]] = length - 1
      } else {
        this.add(pair)
      }
    }, this)
  },

  entries: function() {
    var utags = Object.keys(this._utags)
    var self = this
    return {
      next: function() {
        var utag = utags.shift()
        return utag
          ? { value: [utag, self._elements[self._utags[utag]]], done: false }
          : { done: true }
      }
    }
  },

  values: function() {
    var utags = Object.keys(this._utags)
    var self = this
    return {
      next: function() {
        var utag = utags.shift()
        return utag
          ? { value: self._elements[self._utags[utag]], done: false }
          : { done: true }
      }
    }
  },

  _transform: function(el) {
    return el
  }

}, { constructor: { value: OrSet } })

var arrayMethods = ['forEach', 'filter', 'map', 'reduce']
arrayMethods.forEach(function(method) {
  OrSet.prototype[method] = function() {
    return Array.prototype[method].apply(this._elements, arguments)
  }
})

OrSet.typed = function(T) {
  var TypedOrSet = function(pairs) {
    OrSet.call(this, pairs)
  }

  TypedOrSet.prototype = Object.create(OrSet.prototype, {
    constructor: { value: OrSet }
  })

  TypedOrSet.prototype._transform = function(el) {
    if (el && el instanceof T) {
      return el
    } else {
      return new T(el)
    }
  }

  return TypedOrSet
}
