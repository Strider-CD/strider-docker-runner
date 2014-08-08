var createContainer = require('./create_container');

module.exports = createSlave

function createSlave(docker, config, done) {
  // TODO read config dockerfile build image, etc
  createContainer({
    create: {
      Image: "strider/strider-docker-slave",
      AttachStdin: true,
      OpenStdin: true,
      Tty: true,
      WorkingDir: "/data",
      Cmd:[ "/bin/bash" ] // might need to replace this with something else
    },
    runCommand: function (stdin, command, args) {
      //require('fs').readFileSync('./embedded_runner.js')

      console.log("INBOUND CMD", command);
      console.log("INBOUND ARGS", args);

      var cmd = command+" "+args.join(' ')+"\nexit $?\n";
      console.log("OUTBOUND CMD", cmd);
      stdin.write(cmd);
    }
  }, docker, config, done)
}
