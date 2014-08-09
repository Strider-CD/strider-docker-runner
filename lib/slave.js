var createContainer = require('./create-container');

module.exports = createSlave

function createSlave(docker, config, done) {
  // TODO read config dockerfile build image, etc
  createContainer({
    Image: config.image || "strider/strider-docker-slave",

    // AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    // StdinOnce: true,
    OpenStdin: true,
    Tty: false,

    WorkingDir: "/workspace",
    Cmd:[ "SpawnJSON.js" ] // might need to replace this with something else
  }, docker, config, done)
}
