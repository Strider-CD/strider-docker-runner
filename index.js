var Runner = require('strider-simple-runner').Runner
  , initDocker = require('./lib/init')
  , runDocker = require('./lib/run')

var create = function(emitter, config, context, done){
  config = config || {}
  initDocker(config, function (err, docker) {
    if (err) {
      console.warn("Failed to initialize docker! Make sure permissions are right, config is right, etc.", err)
      return done(new Error('Cannot initialize docker'))
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

