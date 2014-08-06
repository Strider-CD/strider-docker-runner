
var spawnSSH = require('./spawn-ssh')

module.exports = createSlave

function createSlave(docker, jobid, dataDir, image, done) {
  // console.log('slaving away', jobid, dataDir, image)
  var password = 'PASSSWORD'
  var port = '2003'
  var options = {
    WorkingDir: '/data',
    start: {
      // Binds: [dataDir + ':/data'],
      PortBindings: {
        '22/tcp': [{HostPort: port}]
      }
    }
  }
  docker.run(image, ['/run.sh', password], null, options, function (err, data, container) {
  }).on('container', function (container) {
    // console.log('made container', container.id)
    done(null, spawnSSH.bind(null, docker.modem.host, port, password), container.kill.bind(container))
  })
  /*
  docker.createContainer({
    Image: 'strider-slave', // TODO make configurable
    Name: 'job-' + this.job._id,
    /*
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    OpenStdin: true,
    StdinOnce: false,
    /
    Env: null, // change?
    Cmd: ['/run.sh', password],
    Volumes: volumes,
  }, function (err, container) {
    if (err) {
      console.error('Failed to create container', err)
      return done(new Error('failed to create container'))
    }
    container.attach({stream: true, stdin: true, stdout: true, stderr: true}, function (err, stream) {
      container.modem.demuxStream(stream, process.stdout, process.stderr);

      container.start(function (err, data) {
        container.wait(function (err, data) {
        })
      })
    })
  }
  */

}

