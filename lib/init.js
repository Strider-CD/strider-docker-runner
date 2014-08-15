var Docker = require('dockerode')
  , dockerUtil = require('./docker_util')

module.exports = function (options, done) {
  var docker = new Docker(dockerUtil.normalizeOptions(options, env))
  docker.listContainers(function (err) {
    done(err, docker)
  })
}

