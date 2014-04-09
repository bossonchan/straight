var debug = require('debug')('straight:session');
var utils = require('../utils');
var MemoryStore = require('../memory');

module.exports = session;

function session (options) {
  var options = options || {};
  var key = options.key || 'sid';
  var store = options.store || new MemoryStore();
  var storeReady = true;

  store.on('connnect', function () {
    storeReady = true;
  });

  store.on('disconnect', function () {
    storeReady = false;
  });

  return function (socket, request, response) {

    if (request.session) return response.next();

    if (!storeReady) return debug('store is disconnected'), response.next();

    request.sessionStore = store;
    request.sessionId = socket.id;

    // proxy ack() to commit the session
    var ack = response.ack;
    response.ack = function (data) {
      if (!request.session) return ack(data);
      store.set(socket.id, request.session, function (err) {
        if (err) debug(err.stack);
        debug('saved');
        ack(data);
      });
    };

    var sessionId = socket.id;
    store.get(sessionId, function (err, session) {
      if (err) {
        debug('error %j', err);
        response.next(err);
      } else if (!session) {
        debug('no session found');
        request.session = {};
        response.next();
      } else {
        debug("session found");
        request.session = session;
        response.next();
      }
    });

  };
}
