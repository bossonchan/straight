var straight = require('../');

var app = straight();

// process before every event
app.use(function (socket, request, response) {
  console.log("handle event %s", request._event);
  response.next();
});

// use session middleware
app.use(straight.session());

// create server and return io object
var io = app.listen(3000);

io.sockets.on('connection', function (socket) {

  // wrap socket to hack the `on` function
  var client = app.wrap(socket);

  function requiresLogin (socket, request, response) {
    console.log('request: ', request);
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

  client.on('request-test', requiresLogin, responseTest);
  client.on('request-login', login);
});

