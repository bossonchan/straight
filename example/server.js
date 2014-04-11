var debug = require('debug')('straight');
var straight = require('../');

var app = straight();

// process before every event
app.all(function (socket, request, response) {
  debug("handle event %s", request._event);
  response.next();
});

// use session middleware
app.all(straight.session());

function requiresLogin (socket, request, response) {
  var isLogin = request.session.name ? true : false;
  if (isLogin) {
    response.next();
  } else {
    response.ack({message: 'unauthorized'});
  }
}

function responseTest (socket, request, response) {
  var session = request.session;
  response.ack(session)
  // or
  socket.emit('response-test', session);
}

function login (socket, request, response) {
  request.session = {
    name: 'bossonchan'
  };
  response.ack({result: 'success'});
}

app.on('request-test', requiresLogin, responseTest);
app.on('request-login', login);

app.listen(3000);
