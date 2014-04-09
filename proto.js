var io = require('socket.io');
var debug =  require('debug')('straight');

var app = module.exports = {};
app.stack = [];

app.use = function (fn) {
  this.stack.push({event: '*', handle: fn});
  return this;
};

app.wrap = function (socket) {
  var straight = {};
  straight.stack = [];

  /*
   * exports `use` api
   * */
  straight.use = function (event, fn) {
    if ('string' != typeof event) {
      fn = event;
      event = '*';
    }

    var events = this.stack.filter(function (layer) {
      return layer.event === event;
    });

    if (events.length === 0) {
      socket.on(event);
    }

    this.stack.push({event: event, handle: fn});
    return this;
  };

  /*
   * exports `on` api
   * */
  straight.on = function (event) {
    if ('string' != typeof event) {
      return this;
    }

    var handlers = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < handlers.length; i++) {
      this.use(event, handlers[i]);
    }
    return this;
  };

  /*
   * overwrite socekt `on` function
   * */
  socket.on = function (event, listener) {
    var defaultAck = function (data) {
      debug("WARNNING: client does not offter the ack for %s", event);
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
          data = {}
        }
      } else if (arguments.length === 2) {
        if ('function' != typeof ack) {
          ack = defaultAck;
        }
      } else {
        var lastArg = arguments[arguments.length -1];
        if ('function' != typeof lastArg) {
          ack = defaultAck;
        } else {
          ack = lastArg;
        }
        data = arguments[0];
      }

      // merge common event handlers
      var stack = app.stack.concat(straight.stack);
      var index = 0;
      var request = {};
      var response = {};

      request.data = data;
      request._event = event;

      response.ack = ack;
      response.next = function (err) {
        var layer = stack[index++];

        if (!layer) {
          if (err) {
            debug(err.stack);
            return ack({error: 'server internal error'})
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
            // skip this layer if event not match
            this.next(err);
          }
          
        } catch (e) {
          this.next(e);
        }
      };
      response.next();
    };
    require('events').EventEmitter.prototype.on.call(this, event, newListener);
  };
  return straight;
};

app.listen = function () {
  io = io.listen.apply(null, arguments);
  return io;
};
