'use strict';

const Docker = require('dockerode');
const dockerUtil = require('./docker_util');
const domain = require('domain');

module.exports = function (rawOpts, done) {
  const options = dockerUtil.normalizeOptions(rawOpts, process.env);

  const dockerDomain = domain.create();
  dockerDomain.on('error', e => {
    e.connectOptions = options;
    done(e);
  });

  dockerDomain.run(() => {
    try {
      const docker = new Docker(options);
      docker.listContainers(err => {
        if (err) err.connectOptions = options;
        done(err, docker);
      });

    } catch (e) {
      e.connectOptions = options;
      done(e);
    }
  });
};
