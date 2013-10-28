
var core = require('strider-runner-core')
  , Runner = require('strider-simple-runner').Runner
  , rutils = require('strider-simple-runner/lib/utils')
  , _ = require('lodash')

  , StdEmitter = require('./stdemitter')
  , utils = require('./utils')

module.exports = Runner

function DockerRunner(emitter, config) {
  config.log('DOCKER INIT')
  Runner.call(this, emitter, config)
}

util.inherits(DockerRunner, Runner)

_.extend(DockerRunner.prototype, {
  processJob: function (data, next) {
    var config = this.config
      , jobid = data.job._id
      , self = this
    rutils.initJobDirs(path.join(config.dataDir, 'docker'), job, this.cacheDir(job.project), function (dirs, done) {
      var dconf = {
        host: config.host || 'http://localhost',
        port: config.port || 4321
      }
      utils.createContainer(dconf, config.from, config.dockerfile, dirs, function (err, io) {
        if (err) return self.errored(err, data.job._id, false, next)
        self.ios[jobid] = io
        self.attach(io, jobid)
        io.emit('job.new', data.job, data.config)
        io.on('job.done', function (err) {
          var e = null
          if (err) {
            e = new Error(err.message)
            e.stack = err.stack
          }
          self.jobdone(e, jobid, next)
        })
        io.on('close', function (output) {
          self.errored(new Error('docker worker closed unexpectedly'), jobid, false, next)
        })
      })
    })
  }
})
