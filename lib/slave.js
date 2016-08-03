'use strict';

const createContainer = require('./create-container');

module.exports = createSlave;

function createSlave(docker, config, done) {
  createContainer({
    Image: config.image,
    Env: config.env,
    AttachStdout: true,
    AttachStderr: true,
    OpenStdin: true,
    Tty: false,
    name: config.name
  }, docker, config, done);
}
