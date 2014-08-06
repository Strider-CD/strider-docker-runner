
var Docker = require('dockerode')

module.exports = function (host, port, done) {
  var docker = new Docker({
    host: host || process.env.DOCKER_IP,
    port: port || process.env.DOCKER_PORT,
  })
  docker.listContainers(function (err) {
    done(err, docker)
  })
}

