
var Docker = require('dockerode')

module.exports = function (options, done) {
  options.host = options.host || process.env.DOCKER_IP
  options.port = options.port || process.env.DOCKER_PORT

  if (process.env.DOCKER_HOST || options.socketPath) {
    options.socketPath = process.env.DOCKER_HOST
  } else {
    options.socketPath = '/var/run/docker.sock' // default docker path.
  }

  var docker = new Docker(options)
  docker.listContainers(function (err) {
    done(err, docker)
  })
}

