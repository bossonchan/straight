var should = require('should');
var straight = require('..');
var ioc = require('socket.io-client');
var http = require('http').Server;

describe('straight', function () {

  describe('exports', function () {
    it('should expose as a function', function (done) {
      straight.should.be.a.Function;
      done();
    });

    it('should expose middleware', function (done) {
      straight.middleware.should.be.an.Object;
      done();
    });
  });

  describe('app', function () {

    it('should expose `listen`, `wrap` and `use`', function (done) {
      var app = straight();
      app.listen.should.be.a.Function;
      app.use.should.be.a.Function;
      app.wrap.should.be.a.Function;
      done();
    });

    describe('app.listen', function () {

      it('should start a socket.io and return a `io` object', function (done) {
        var app = straight();
        var io = app.listen(3000);
        io.set('log level', 1);
        io.sockets.on('connection', function (socket) {
          io.server.close();
          done();
        });
        var client = ioc.connect('http://localhost:3000');
      });

    });

    describe('app.use', function () {
      it('should register global handler before every event', function (done) {
        var app = straight();
        app.use(function (socket, request, response) {
          io.server.close();
          done();
        });

        var io = app.listen(3001);
        io.sockets.on('connection', function (socket) {
          var s = app.wrap(socket);
          s.use('test');
        });

        var client = ioc.connect('http://localhost:3001');
        client.emit('test', {});
      });
    });

  });
});
