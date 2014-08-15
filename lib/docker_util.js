var URI = require('uri-js');

module.exports = {
  normalizeOptions: function (options, env) {
    var host = options.host || env.DOCKER_IP
    var port = options.port || env.DOCKER_PORT
    var full_host = options.docker_host || env.DOCKER_HOST
    if (host && port) {
      options.host = host
      options.port = port
    } else if (full_host) {
      var uri = URI.parse(full_host);
      if (uri.scheme === "http" || uri.scheme === "tcp") {
        options.host = uri.host
        options.port = uri.port
      } else if (uri.scheme === "unix") {
        options.socketPath = uri.path
      } else {
        throw new Error("Could not normalize options from DOCKER_HOST")
      }
    } else {
      // default to the default socket path
      options.socketPath = '/var/run/docker.sock'
    }
    return options;
  }
}
