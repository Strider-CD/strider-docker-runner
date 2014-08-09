var createContainer = require('./create_container');

module.exports = createSlave

function createSlave(docker, config, done) {
  // TODO read config dockerfile build image, etc
  createContainer({
    create: {
      Image: "strider/strider-docker-slave",

      // AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      // StdinOnce: true,
      OpenStdin: true,
      Tty: false,

      WorkingDir: "/workspace",
      Cmd:[ "SpawnJSON.js" ] // might need to replace this with something else
    },
    runCommand: function (stdin, command, args) {
      //require('fs').readFileSync('./embedded_runner.js')

      console.log("INBOUND CMD", command);
      console.log("INBOUND ARGS", args);

      stdin.write(JSON.stringify({command: command, args: args}));
      // stdin.end()
    }
  }, docker, config, done)
}
