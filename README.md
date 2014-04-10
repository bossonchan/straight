Straight
========

Straight is a light framework for socket.io using the art of middleware.

Example
=======

```javascript

var straight = require('straight');
var app = straight();

// process before every event
app.use(function (socket, request, response) {
  console.log("Handling event %s", request._event);
  response.next();
});

// use session middleware
// you can access the session by `request.session`
app.use(straight.session());

// return the `io` object
var io = app.listen(3000);

io.sockets.on('connection', function (socket) {

  // Wrap a socket object to overwirte the `on` function
  var client = app.wrap(socket);

  function requiresLogin (socket, request, response) {
    var isLogin = request.session.isLogin;
    if (isLogin) {
      response.next();
    } else {
      response.ack({message: "sorry, you should log in frist."});
    }
  }

  function sayHello (socket, request, response) {
    var data = {message: 'hello, everyone!'};
    socket.emit('event-name', data);
    // or
    response.ack(data);
  }

  socket.on('some-event', requiresLogin, sayHello);
});

```

