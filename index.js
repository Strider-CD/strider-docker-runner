var Runner = require('strider-simple-runner').Runner
  , initDocker = require('./lib/init')
  , runDocker = require('./lib/run')

var create = function(emitter, config, context, done){
  config = config || {}
  initDocker(config, function (err, docker) {
    if (err) {
      console.warn("Docker is unreachable. strider-docker-runner will not work until you fix the configuration.")
    }

    config.processJob = runDocker.bind(null, docker)
    var runner = new Runner(emitter, config)
    runner.id = 'docker'
    runner.loadExtensions(context.extensionPaths, function (err) {
      done(err, runner)
    })
  })
}

module.exports = {
  create: create,
  config: {
    host: String,
    port: Number,
    socketPath: String,
  }
}

