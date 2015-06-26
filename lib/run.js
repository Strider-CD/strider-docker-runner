var createSlave = require('./slave')
var processJob = require('strider-runner-core').process
var _ = require('lodash')
var initDocker = require('./init')
var util = require('util')

module.exports = function (job, provider, plugins, config, next) {
  initDocker(config.branchConfig.runner.config, function (err, docker) {
    if (err)
      return next(new Error('Cannot connect to Docker with options '+util.format(err.connectOptions)
                           +"\nActual Error: "+err.stack));

    var env = []
    _.each(plugins, function (plugin) {
      if (plugin.env) {
        _.each(plugin.env, function (value, key) {
          env.push(key+"="+value)
        })
      }
    })
    var slaveConfig = _.extend({
      id: job._id,
      dataDir: config.dataDir,
      image: 'strider/strider-docker-slave',
      env: env,
    }, config.branchConfig.runner.config)
    slaveConfig.image = slaveConfig.image || "strider/strider-docker-slave"
    if (slaveConfig.dns && slaveConfig.dns.length > 6) {
      slaveConfig.dns   = slaveConfig.dns.split(",")
    }
    if (slaveConfig.docker_volumeBinds && slaveConfig.docker_volumeBinds.indexOf(',') > -1) {
      slaveConfig.docker_volumeBinds = slaveConfig
                                                 .docker_volumeBinds
                                                 .split(",")
                                                 .map(function (volBinding) {
                                                   return volBinding.trim();
                                                 });
    }
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
  })
}
