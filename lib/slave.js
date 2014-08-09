var createContainer = require('./create-container');

module.exports = createSlave

function createSlave(docker, config, done) {
  // TODO read config dockerfile build image, etc
  createContainer({
    Image: config.image,

    // AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    // StdinOnce: true,
    OpenStdin: true,
    Tty: false,
  }, docker, config, done)
}
