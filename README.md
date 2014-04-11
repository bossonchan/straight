Straight
========

Straight is a light framework for socket.io using the art of middleware.

Install
=======
```bash
npm install socket-straight
```

Example
=======

```javascript

var straight = require('socket-straight');
var app = straight();

// use session middleware
// and access session by `request.session`
app.all(straight.session());

// process before every channel and event
app.all(function (socket, request, response) {
  console.log("handling event %s", request._event);
  response.next();
});

function requiresLogin (socket, request, response) {
  var session = request.session;
  if (session.uid) {
    response.next();
  } else {
    response.ack('you should login first!');
    // or
    socket.emit('response-test', {message: 'you should login first!'});
  }
}

function sayHello (socket, request, response) {
  // do something..
  var result = {
    message: 'hello
  };

  response.ack(result);
  // or
  socket.emit('response-test', result);
}

// same as `app.channel('/').on`
app.on('request-test', requiresLogin, sayHello);

// use `/users` channel
var usersChannel = app.channel('/users');
usersChannel.on('login', function (socket, request, response) {
  request.session = {
    uid: 'xxxx'
  };
  response.ack('success');
});

// start socket.io server
app.listen(3000);

```

