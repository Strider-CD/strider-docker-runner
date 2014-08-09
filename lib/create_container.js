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
      container.attach({
        stream: true, stdin: true,// logs: true,
        stdout: true, stderr: true
      }, function (err, streamc) {
        if (err) return done(err, proc);
        if (!streamc) return done(new Error("Failed to attach container stream"), proc);

        proc.kill = container.stop.bind(container, function () {});
        proc.stdout = new stream.PassThrough();
        proc.stderr = new stream.PassThrough();
        proc.stdin = streamc;
        slaveOptions.runCommand(streamc, command, args)
        docker.modem.demuxStream(streamc, proc.stdout, proc.stderr);

        container.start(function(err, data) {
          if(err) return done(new Error(err), proc);
          container.wait(function(err, data) {
            console.log('done with this', err, data)
            container.stop(function (err, _) {
              proc.emit('exit', data.StatusCode);
            })
          })
          done(err, proc)
        });
      });
    }

    done(null, spawn, kill)
  })
}
