var proto = require('./proto');
var utils = require('./utils');
var basename = require('path').basename;

exports = module.exports = createServer;

exports.middleware = {};

function createServer () {
  var app = {};
  app.stack = [];
  app.channels = {};
  app.server = null;
  utils.merge(app, proto);
  return app;
}

require('fs').readdirSync(__dirname + '/middleware').forEach(function (filename) {
  var name = basename(filename, '.js');
  function load () { return require('./middleware/' + name); }
  exports.middleware.__defineGetter__(name, load);
  exports.__defineGetter__(name, load);
});
