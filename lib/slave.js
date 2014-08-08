//var spawnSSH = require('./spawn-ssh')

var stream = require('stream');
var EventEmitter = require('events').EventEmitter;

module.exports = createSlave

//'docker run --rm -a stdin -a stdout -a stderr -i --workdir /data strider/strider-docker-slave bash'

function createSlave(docker, config, done) {
  docker.createContainer({
    Image: "strider/strider-docker-slave",
    AttachStdin: true,
    OpenStdin: true,
    Tty: true,
    WorkDir: "/data",
    Cmd:[ "/bin/bash" ] // might need to replace this with something else
  }, function (err, container) {
    if (err) return done(new Error(err));
    console.log('[runner:docker] container id', container.id)

    var kill = function (done) {
      container.remove({
        force: true, // Stop container and remove
        v: true // Remove any attached volumes
      }, done)
    }

    var spawn = function (command, args, options, done) {
      var proc = new EventEmitter();
      container.start(function(err, data) {
        if(err) return done(new Error(err), proc);
        container.attach({
          stream: true, stdin: true,
          stdout: true, stderr: true
        }, function (err, streamc) {
          if (err) return done(err, proc);
          if(streamc) {
            proc.stdout = new stream.PassThrough();
            proc.stderr = new stream.PassThrough();
            docker.modem.demuxStream(streamc, proc.stdout, proc.stderr);

            streamc.write("cd /data\n");
            streamc.write(command+" "+args.join(' ')+"\n")
            streamc.write("exit $?\n")

            container.wait(function(err, data) {
              proc.emit('exit', data.StatusCode);
            })
            done(err, proc)
          } else done(new Error("Failed to attach container stream"), proc);
        });
      });
    }

    done(null, spawn, kill)
  })
}
