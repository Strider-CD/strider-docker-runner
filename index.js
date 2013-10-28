
var Runner = require('strider-simple-runner').Runner

  , runDocker = require('./lib')

function create(emitter, config, context, done) {
  config = config || {}
  config.processJob = runDocker
  var runner = new Runner(emitter, config)
  runner.loadExtensions(context.extensionPaths, function (err) {
    done(err, runner)
  })
}

module.exports = {
  create: create
}

