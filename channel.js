var debug = require('debug')('straight');

module.exports = Channel

function Channel (manager, name) {
  this.manager = manager
  this.name = name;
  this.stack = [];
}

Channel.prototype.use = function (event, fn) {
  if ('string' != typeof event) {
    fn = event;
    event = '*';
  }
  this.stack.push({event: event, handle: fn});
  return this;
}

Channel.prototype.on = function (event) {
  if ('string' != typeof event) {
    return this;
  }

  var handlers = Array.prototype.slice.call(arguments, 1);
  for (var i = 0; i < handlers.length; i++) {
    this.use(event, handlers[i]);
  }
  return this;
}

Channel.prototype.init = function (socket, namespace) {
  var self = this;

  // overwirte `on` api
  socket.on = function (event, listener) {

    var defaultAck = function (data) {
      debug("WARNNING: client does not offer ack for event %s", event);
      debug("Using response-%s instead", event);
      socket.emit('response-' + event, data);
    };

    var newListener = function (data, ack) {
      if (arguments.length <= 0) {
        data = {};
        ack = defaultAck;
      } else if (arguments.length === 1) {
        if ('function' != typeof data) {
          ack = defaultAck;
        } else {
          ack = data;
          data = {};
        }
      } else if (arguments.length === 2) {
        if ('function' != typeof ack) {
          ack = defaultAck;
        }
      } else {
        var lastArg = arguments[arguments.length - 1];
        if ('function' != typeof lastArg) {
          ack = defaultAck;
        } else {
          ack = lastArg;
        }
        data = arguments[0];
      }

      var manager = self.manager;
      var stack = manager.stack.concat(self.stack);
      var index = 0;

      var request  = {};
      var response = {};

      request.data = data;
      request._event = event;
      request.channel = self;
      request.namespace = namespace;

      response.ack = ack;
      response.next = function (err) {

        var layer = stack[index++];

        if (!layer) {
          if (err) {
            debug(err.stack);
            return ack({error: 'server internal error'});
          } else {
            return ack();
          }
        }

        try {
          if (layer.event === '*' || layer.event === event) {
            if (err) {
              this.next(err);
            } else {
              layer.handle(socket, request, response);
            }
          } else {
            // skip this layer if event not match.
            this.next(err);
          }
        } catch (e) {
          this.next(e);
        }
      };
      response.next();
    };
    require('events').EventEmitter.prototype.on.call(socket, event, newListener);
  };

  // listen events
  this.stack
    .filter(function (layer) { return layer.event !== '*'; })
    .map(function (layer) { return layer.event; })
    .forEach(function (event) {
      socket.on(event, function () {});
    });
}
