var Runner = require('strider-simple-runner').Runner
  , runDocker = require('./lib/run')

var create = function(emitter, config, context, done){
  config = config || {}
  config.processJob = runDocker
  var runner = new Runner(emitter, config)
  runner.id = 'docker'
  runner.loadExtensions(context.extensionPaths, function (err) {
    done(err, runner)
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
