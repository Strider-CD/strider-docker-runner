
var fs = require('fs')
  , path = require('path')

  , core = require('strider-runner-core')
  , Loader = require('strider-extension-loader')

  , Docker = require('dockerode')

module.exports = {
  createContainer: createContainer
}

// config: {host:, port:}
// from: the name of the base docker image
// dockerfile: text of dockerfile
// dirs: {base:, data:, cache:}
// done(err, io)
function createContainer(config, from, dockerfile, dirs, done) {
  var docker = new Docker(config)
}
