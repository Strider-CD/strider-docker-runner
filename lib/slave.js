//var spawnSSH = require('./spawn-ssh')

module.exports = createSlave


function createSlave(docker, config, done) {
  var options = {
    create: {
      Image: "strider/strider-docker-slave",
      AttachStdin: true,
      OpenStdin: true,
      Tty: true,
      Env: {/* honor config.env -- is it there? */},
      Cmd:[ "/bin/bash" ]
    }
  }

  //'docker run --rm -a stdin -a stdout -a stderr -i --workdir /data strider/strider-docker-slave bash'
  docker.createContainer(options.create, function (err, container) {
    if (err) return done(err);
    console.log('[runner:docker] container id', container.id)
    console.log("STARTING");
    container.start(function(err, data) {
      if(err) return callback(err, data);

      console.log("ATTACHING")
      container.attach({
        stream: true, stdin: true,
        stdout: true, stderr: true
      }, function (err, streamc) {
        if (err) return done(err);

        console.log("ATTACHED");
        if(streamc) {
          var stdout = new stream.PassThrough();
          var stderr = new stream.PassThrough();
          docker.modem.demuxStream(streamc, stdout, stderr);

          stdout.on('data', function(chunk) {
            console.info("[docker]", chunk)
          });

          stderr.on('data', function(chunk) {
            console.error("[docker]", chunk)
          });

          stream.write("echo 'in it 2 win it'\n")
          stream.write("pwd\n")
          stream.write("exit\n")
        }

        console.log("STARTED, WAITING")
        container.wait(function(err, data) {
          console.log("DONE WAITING, REMOVING")
          done(err, /*spawn*/null, /*kill*/function (afterKill) {
            container.remove({
              force: true, // Stop container and remove
              v: true // Remove any attached volumes
            }, afterKill)
          })
        });
      });
    });
  })
}
