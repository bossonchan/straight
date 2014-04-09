var io = require('socket.io-client');

var client = io.connect('http://localhost:3000');

client.emit('request-test', function (data) {
  console.log(data); // {message: 'unauthorized'}

  client.emit('request-login', function (data) {
    console.log(data); // {result: 'success'}

    client.emit('request-test', {}, function (data) {
      console.log(data); // {name: 'bossonchan'}
    });
  });
});

client.on('response-test', function (data) {
  console.log(data); // {name: 'bossonchan'}
});

