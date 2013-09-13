
var Runner = require('strider-simple-runner').Runner

  , runDocker = require('./lib')

function create(emitter, opts, cb) {
  opts.processJob = runDocker
  var runner = new Runner(emitter, opts)
  cb(null)
}

module.exports = {
  create: create
}

