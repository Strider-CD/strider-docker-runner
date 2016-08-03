'use strict';

const Docker = require('dockerode');
const dockerUtil = require('./docker_util');
const domain = require('domain');

module.exports = function (rawOpts, done) {
  const options = dockerUtil.normalizeOptions(rawOpts, process.env);
  const d = domain.create();
  d.on('error', function (e) {
    e.connectOptions = options;
    done(e);
  });
  d.run(function () {
    try {
      const docker = new Docker(options);
      docker.listContainers(function (err) {
        if (err) err.connectOptions = options;
        done(err, docker);
      });
    } catch (e) {
      e.connectOptions = options;
      done(e);
    }
  });
};
