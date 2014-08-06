
module.exports = Slave

function Slave(docker, emitter, job, config) {
  this.docker = docker
  this.emitter = emitter
  this.job = job
  this.config = config
  this.init()
}

Slave.prototype = {
  init: function () {
    this.docker.createContainer({
      Image: 'strider-slave', // TODO make configurable
      Name: 'job-' + this.job._id
    }, function (err, container) {
      if (err) {
        return console.error('Failed to create container', err)
      }
      container.start()
    })
  }

}

