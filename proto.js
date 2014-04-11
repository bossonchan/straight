var debug =  require('debug')('straight');
var Channel = require('./channel');

var app = module.exports = {};
app.stack = [];
app.channels = {};
app.server = null;

app.all = function (fn) {
  if ('function' != typeof fn) {
    return this;
  }
  this.stack.push({event: '*', handle: fn});
  return this;
}

app.use = function () {
  var channel = this.channel('/');
  channel.use.apply(channel, arguments);
};

app.on = function () {
  var channel = this.channel('/');
  channel.on.apply(channel, arguments);
}

app.channel = function (name) {
  if (this.channels[name]) {
    return this.channels[name];
  }
  return this.channels[name] = new Channel(this, name);
}

app.listen = function () {
  var io = require('socket.io');
  var ioServer = io.listen.apply(null, arguments);

  var channels = Object.keys.call(null, this.channels);
  var self = this;

  channels.forEach(function (channel) {
    debug("initial channel %s", channel);
    var namespace = channel === '/' ? ioServer.sockets : ioServer.of(channel);
    namespace.on('connection', function (socket) {
      self.channels[channel].init(socket, namespace);
    });
  });

  this.server = ioServer;
  return this;
};

app.close = function () {
  this.server && this.server.close();
}
