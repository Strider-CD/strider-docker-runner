
var createSlave = require('./slave')
var processJob = require('strider-runner-core').process

module.exports = function (docker, job, provider, plugins, config, next) {
  // console.log('docker on the job!!', job._id)
  var image = config.branchConfig.runner.image || 'strider/strider-docker-slave'
  var debug = config.branchConfig.runner.debug
  config.io.emit('job.status.command.comment', job._id, {comment: 'Creating docker container from ' + image, plugin: 'docker', time: new Date()})
  createSlave(docker, {
    id: job._id, 
    dataDir: config.dataDir,
    image: image,
    debug: debug,
  }, function (err, spawn, kill) {
    if (err) return next(err)
    config.spawn = spawn
    processJob(job, provider, plugins, config, function () {
      var args = arguments
      // console.log('killing')
      kill(function (err) {
        if (err) console.error('Failed to kill docker container!', err)
        next.apply(this, args)
      })
    })
  })
}

