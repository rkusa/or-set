'use strict'

var expect = require('chai').expect
var uuid   = require('node-uuid')
var OrSet  = require('../')

if (typeof Object.observe !== 'function') {
  require('observe-shim')
}

var getNotifier = Object.getNotifier
delete Object.getNotifier

test('initialization', function() {
  var s = new OrSet

  expect(s._elements).to.have.lengthOf(0)
  expect(s._utags).to.eql({})
})

test('initialization with existing pairs', function() {
  var s = new OrSet([['a', '1'], ['b', '2']])

  expect(s._elements).to.eql(['a', 'b'])
  expect(s._utags).to.eql({
    '1': 0,
    '2': 1
  })
})

test('local .add()', function() {
  var s = new OrSet
  s.add('a')
  s.add('a')
  s.add('b')

  expect(s._elements).to.eql(['a', 'b'])
  var utags = Object.keys(s._utags)
  expect(utags).to.have.lengthOf(2)
  utags.forEach(function(utag, i) {
    expect(s._utags[utag]).to.equal(i)
  })
})

test('downstream .add()', function() {
  var s = new OrSet
  s.add('a', uuid.v4())

  expect(s._elements).to.eql(['a'])
  var utags = Object.keys(s._utags)
  expect(s._utags[utags[0]]).to.equal(0)
})

test('downstream .add() (duplicate)', function() {
  var s = new OrSet
  s.add('a')
  s.add('a', uuid.v4())

  expect(s._elements).to.eql(['a'])
  for (var utag in s._utags) {
    expect(s._utags[utag]).to.equal(0)
  }
})

test('local .remove()', function() {
  var s = new OrSet
  s.add('a')
  s.add('b')
  s.remove('a')

  expect(s._elements).to.eql(['b'])
  var utags = Object.keys(s._utags)
  expect(utags).to.have.lengthOf(1)
  expect(s._utags[utags[0]]).to.equal(0)
})

test('downstream .remove()', function() {
  var s = new OrSet
  var utag = uuid.v4()
  s.add('b')
  s.add('a', utag)

  s.remove('a', utag)
  expect(s._elements).to.eql(['b'])
  var utags = Object.keys(s._utags)
  expect(utags).to.have.lengthOf(1)
})

test('downstream .remove() (duplicate)', function() {
  var s = new OrSet
  var utag = uuid.v4()
  s.add('a')
  s.add('a', utag)

  s.remove('a', utag)
  s.remove('a', uuid.v4())
  expect(s._elements).to.eql(['a'])
  var utags = Object.keys(s._utags)
  expect(utags).to.have.lengthOf(1)
  expect(utags).to.not.include(utag)
})

test('.remove() non existing', function() {
  var s = new OrSet
  s.remove('a')
})

test('.has()', function() {
  var s = new OrSet
  expect(s.has('a')).to.be.false
  s.add('a')
  expect(s.has('a')).to.be.true
})

test('.reset()', function() {
  var s = new OrSet(['a', 'b'])
  s.reset(['c'])
  expect(s.size).to.equal(1)
  expect(s.has('a')).to.be.false
  expect(s.has('b')).to.be.false
  expect(s.has('c')).to.be.true
})

test('forEach()', function() {
  var items = ['a', 'b'], pos = 0
  var s = new OrSet(['a', 'b'])
  s.forEach(function(val, i, arr) {
    expect(val).to.equal(items[pos])
    expect(i).to.equal(pos++)
    expect(arr).to.eql(items)
  })
})

test('filter()', function() {
  var items = ['a', 'b'], pos = 0
  var s = new OrSet(['a', 'b'])
  expect(s.filter(function(val, i, arr) {
    expect(val).to.equal(items[pos])
    expect(i).to.equal(pos++)
    expect(arr).to.eql(items)
    return val === 'a'
  })).to.eql(['a'])
})

test('.map()', function() {
  var items = ['a', 'b'], pos = 0
  var s = new OrSet(['a', 'b'])
  expect(s.map(function(val, i, arr) {
    expect(val).to.equal(items[pos])
    expect(i).to.equal(pos++)
    expect(arr).to.eql(items)
    return val.toUpperCase()
  })).to.eql(['A', 'B'])
})

test('.reduce()', function() {
  var items = ['a', 'b'], pos = 0
  var s = new OrSet(['a', 'b'])
  expect(s.reduce(function(lhs, rhs, i, arr) {
    expect(rhs).to.equal(items[pos])
    expect(i).to.equal(pos++)
    expect(arr).to.eql(items)
    return lhs + rhs
  }, '')).to.eql('ab')
})

suite('Object.observe', function() {
  suiteSetup(function() {
    Object.getNotifier = getNotifier
  })

  test('add', function(done) {
    var s = new OrSet

    var observer = function(changes) {
      var change = changes[0]
      setImmediate(function() {
        expect(change.object).to.equal(s)
        expect(change.type).to.equal('add')
        expect(change.name).to.equal('0')
        expect(change.value).to.equal('a')
        done()
      })
    }

    Object.observe(s, observer)

    s.add('a', '0')
    Object.deliverChangeRecords(observer)
  })

  test('remove (local)', function(done) {
    var s = new OrSet
    s.add('a', '0')

    var observer = function(changes) {
      var change = changes[0]
      setImmediate(function() {
        expect(change.object).to.equal(s)
        expect(change.type).to.equal('delete')
        expect(change.name).to.equal('0')
        expect(change.oldValue).to.equal('a')
        done()
      })
    }

    Object.observe(s, observer)

    s.remove('a', '0')
    Object.deliverChangeRecords(observer)
  })

  test('remove (remote)', function(done) {
    var s = new OrSet
    s.add('a', '0')

    var observer = function(changes) {
      var change = changes[0]
      setImmediate(function() {
        expect(change.object).to.equal(s)
        expect(change.type).to.equal('delete')
        expect(change.name).to.equal('0')
        expect(change.oldValue).to.equal('a')
        done()
      })
    }

    Object.observe(s, observer)

    s.remove('a')
    Object.deliverChangeRecords(observer)
  })
})
