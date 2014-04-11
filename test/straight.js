var should = require('should');
var straight = require('..');
var ioc = require('socket.io-client');
var http = require('http');
var Channel = require('../channel');

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

    it('should expose `listen`, `channel`, `all`, `on` and `use`', function (done) {
      var app = straight();
      app.listen.should.be.a.Function;
      app.all.should.be.a.Function;
      app.use.should.be.a.Function;
      app.on.should.be.a.Function;
      app.channel.should.be.a.Function;
      done();
    });

    describe('app.listen', function () {
      it('should start socket.io server', function (done) {
        var app = straight();
        app.listen(3000, function () {
          app.close();
          done();
        });
      });
    });

    describe('app.channel', function () {

      it('should return a channel object', function (done) {
        var app = straight();
        channel = app.channel('/name');
        channel.should.be.an.instanceof(Channel);
        done();
      });

      it('should create a new channel object if not exists', function (done) {
        var app = straight();
        var channelName = '/users';
        (app.channels[channelName] === undefined).should.be.true
        app.channel(channelName);
        app.channels[channelName].should.be.ok;
        done();
      });
    });

    describe('app.all', function () {
      it('should register a event handler for every event', function (done) {
        var app = straight();
        app.all(function (socket, request, response) {
          app.close();
          done();
        });
        var randomEvent = "event-" + (Math.random() * 1000);
        app.use(randomEvent, function () {});

        app.listen(3000);

        var client = ioc.connect('http://localhost:3000');
        client.emit(randomEvent);
      });

      it('should register a event handler for every channel', function (done) {
        var app = straight();
        var count = 0;
        var check = function () {
          ++count;
          if (count === 2) done();
        }
        app.all(function (socket, request, response) {
          check();
        });

        app.channel('/users').use('user-event', function () {});
        app.channel('/chats').use('chat-event', function () {});
        app.listen(4000);

        var clientInUsersChannel = ioc.connect('http://localhost:4000/users');
        var clientInChatsChannel = ioc.connect('http://localhost:4000/chats');

        clientInUsersChannel.emit('user-event');
        clientInChatsChannel.emit('chat-event');
      });
    });
  });

  describe('channel', function () {

    describe('Channel.prototype.use', function () {
      it('should register a event handler for a specific event', function (done) {
        var app = straight();
        app.channel('/users').use('specific-event', function (socket, request, response) {
          done();
        });
        app.listen(5000);
        var client = ioc.connect('http://localhost:5000/users');
        client.emit('specific-event');
      });
    });
    
    describe('Channel.prototype.on', function () {
      it('should register some evet handlers for a specific event', function (done) {
        var app = straight();
        app.channel('/users').on('specific-event', function (socket, request, response) {
          response.next();
        }, function (socket, request, response) {
          done();
        });
        app.listen(6000);
        var client = ioc.connect('http://localhost:6000/users');
        client.emit('specific-event');
      });
    });

  });

  describe('request', function () {
    it('should expose properties: data, _event, channel, namespace', function (done) {
      var app = straight();
      app.use('test', function (socket, request, response) {
        request.should.have.property('data');
        request.should.have.property('_event');
        request.should.have.property('channel');
        request.should.have.property('namespace');
        done();
      });
      app.listen(7000);
      var client = ioc.connect('http://localhost:7000');
      client.emit('test');
    });
  });

  describe('response', function () {
    it('should expose functions: `next` and `ack`', function (done) {
      var app = straight();
      app.use('test', function (socket, request, response) {
        response.should.have.property('next');
        response.should.have.property('ack');
        response.next.should.be.a.Function;
        response.ack.should.be.a.Function;
        done();
      });
      app.listen(8000);
      var client = ioc.connect('http://localhost:8000');
      client.emit('test');
    });
  });
});
