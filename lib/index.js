
var Docker = require('dockerode')
var Slave = require('./slave')

module.exports = DockerRunner

function DockerRunner(emitter, config) {
  this.emitter = emitter
  this.config = config
  this.slaves = {}
  this.listen()
}

DockerRunner.prototype = {
  init: function (done) {
  },

  listen: function () {
    this.emitter.on('job.new', this.onNew.bind(this))
    this.emitter.on('job.cancel', this.onCancel.bind(this))
    // this.emitter.on('job.info', this.onInfo.bind(this))
  },

  onNew: function (job, config) {
    if (config.runner.id !== 'docker') return
    var slave = this.slaves[job._id] = new Slave(this.docker, this.emitter, job, config)
    slave.on('job.done', function () {
      delete this.slaves[job._id]
    }.bind(this))
  },

  onCancel: function (id) {
    if (!this.slaves[id]) return
    this.slaves[id].emit('job.cancel', id)
  },
}

