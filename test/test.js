/*eslint-env mocha */

'use strict'

var expect = require('chai').expect
var uuid   = require('node-uuid')
var OrSet  = require('../')

test('initialization', function() {
  var s = new OrSet

  expect(s._elements).to.have.lengthOf(0)
  expect(s._utags).to.eql({})
})

test('initialization with existing pairs', function() {
  var s = new OrSet([
    { e: 'a', u: 1 },
    { e: 'b', u: 2 }
  ])

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
  s.add('a')
  s.add('a', utag)

  s.remove('a', utag)
  expect(s._elements).to.eql(['a'])
  var utags = Object.keys(s._utags)
  expect(utags).to.have.lengthOf(1)
  expect(utags).to.not.include(utag)
})