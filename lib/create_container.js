var stream = require('stream');
var EventEmitter = require('events').EventEmitter;
var es = require('event-stream')

var demuxer = require('./demuxer')

module.exports = function (slaveOptions, docker, config, done) {
  docker.createContainer(slaveOptions.create, function (err, container) {
    if (err) return done(new Error(err));
    console.log('[runner:docker] container id', container.id)

    container.attach({
      stream: true, stdin: true,// logs: true,
      stdout: true, stderr: true
    }, attached);

    function attached (err, streamc) {
      if (err) return done(err)
      if (!streamc) return done(new Error("Failed to attach container stream"))

      // start, and wait for it to be done
      container.start(function(err, data) {
        if(err) return done(new Error(err))
        container.wait(function(err, data) {
          console.log('done with this', err, data)
          container.stop(function (err, _) {
            console.log('Stopped the container!')
          })
        })
        done(err, spawn.bind(null, streamc), kill)
      })
    }

    function kill (done) {
      container.remove({
        force: true, // Stop container and remove
        v: true // Remove any attached volumes
      }, done)
    }

    function spawn (streamc, command, args, options, done) {
      var proc = new EventEmitter();
      proc.kill = function () {
        streamc.write(JSON.stringify({type: 'kill'})+'\n')
      }
      proc.stdout = new stream.PassThrough();
      proc.stderr = new stream.PassThrough();
      proc.stdin = streamc;
      var stdout = new stream.PassThrough()
      var stderr = new stream.PassThrough()

      done(null, proc)

      var demux = demuxer(streamc, stdout, stderr)

      stdout
        .pipe(es.split())
        .pipe(es.parse())
        .pipe(es.mapSync(function (data) {
          console.log('got something', data)
          if (data.event === 'stdout') {
            proc.stdout.write(data.data)
          }
          if (data.event === 'stderr') {
            proc.stderr.write(data.data)
          }
          if (data.event === 'exit') {
            proc.emit('exit', data.code)
            streamc.removeListener('readable', demux)
            stdout.unpipe()
          }
        }))

      // slaveOptions.runCommand(streamc, command, args)
      console.log("INBOUND CMD", command);
      console.log("INBOUND ARGS", args);

      streamc.write(JSON.stringify({command: command, args: args, type: 'start'}) + '\n');
    }

  })
}
