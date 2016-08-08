'use strict';

const createContainer = require('./create-container');
const debug = require('debug')('strider-docker-runner:slave');
const resolveLinks = require('./links').resolveLinks;

module.exports = createSlave;

function createSlave(docker, config, done) {
  resolveLinks(docker, config.docker_links, (err, links) => {
    if (err) return done(err);

    debug('Creating container...');
    createContainer({
      Image: config.image,
      Env: config.env,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      Tty: false,
      name: config.name,
      Binds: config.docker_volumeBinds,
      Links: links,
      Privileged: config.privileged,
      PublishAllPorts: config.publishPorts,
      Dns: config.dns
    }, docker, config, done);
  });
}
