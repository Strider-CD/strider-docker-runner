var Docker = require('dockerode')
  , dockerUtil = require('./docker_util')

module.exports = function (rawOpts, done) {
  var options = dockerUtil.normalizeOptions(rawOpts, process.env)
  var docker = new Docker(options)
  docker.listContainers(function (err) {
    done(err, docker)
  })
}

