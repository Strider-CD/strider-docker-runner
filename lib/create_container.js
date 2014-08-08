var stream = require('stream');
var EventEmitter = require('events').EventEmitter;

module.exports = function (slaveOptions, docker, config, done) {
  docker.createContainer(slaveOptions.create, function (err, container) {
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
            container.wait(function(err, data) {
              proc.emit('exit', data.StatusCode);
            })
            slaveOptions.runCommand(streamc, command, args)
            done(err, proc)
          } else done(new Error("Failed to attach container stream"), proc);
        });
      });
    }

    done(null, spawn, kill)
  })
}
