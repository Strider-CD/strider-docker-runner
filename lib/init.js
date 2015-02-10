var Docker = require('dockerode')
  , dockerUtil = require('./docker_util')
  , domain = require('domain')

module.exports = function (rawOpts, done) {
  var options = dockerUtil.normalizeOptions(rawOpts, process.env)
  var d = domain.create();
  d.on('error', function(e) {
    e.connectOptions = options;
    done(e);
  });
  d.run(function() {
    try {
      var docker = new Docker(options)
      docker.listContainers(function (err) {
        if (err) err.connectOptions = options;
        done(err, docker);
      })
    } catch (e) {
      e.connectOptions = options;
      done(e);
    }
  })
}

