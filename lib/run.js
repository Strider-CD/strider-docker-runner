var createSlave = require('./slave')
var processJob = require('strider-runner-core').process
var _ = require('lodash')

module.exports = function (docker, job, provider, plugins, config, next) {
  var slaveConfig = _.extend({
    id: job._id, 
    dataDir: config.dataDir,
    image: 'strider/strider-docker-slave',
  }, config.branchConfig.runner.config)
  slaveConfig.image = slaveConfig.image || "strider/strider-docker-slave"
  config.io.emit('job.status.command.comment', job._id, {
    comment: 'Creating docker container from ' + slaveConfig.image,
    plugin: 'docker',
    time: new Date(),
  })
  createSlave(docker, slaveConfig, function (err, spawn, kill) {
    if (err) return next(err)
    config.spawn = spawn
    processJob(job, provider, plugins, config, function (err) {
      if (err) next(new Error(err))
      var args = arguments
      kill(function (err) {
        if (err) console.error('Failed to kill docker container!', err)
        next.apply(this, args)
      })
    })
  })
}
