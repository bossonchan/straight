var straight = require('./');
var debug = require('debug')('straight');

var app = straight();

app.all(straight.session());

app.use('request-test', function (socket, request, response) {
  request.session = {
    name: 'shin'
  };
  response.next();
});

app.use('request-test', function (socket, request, response) {
  var session = request.session;
  response.ack(session);
});

app.listen(3000);
