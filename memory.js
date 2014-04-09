var EventEmitter = require('events').EventEmitter;

module.exports = Memory;

function Memory () {
  this.session = {};
}

Memory.prototype.__proto__ = EventEmitter.prototype;

Memory.prototype.get = function (sessionId, callback) {
  var session = this.session[sessionId];
  callback(null, session);
}

Memory.prototype.set = function (sessionId, session, callback) {
  this.session[sessionId] = session;
  callback(null);
}
