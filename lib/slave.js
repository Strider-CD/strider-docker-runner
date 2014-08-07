
var spawnSSH = require('./spawn-ssh')
var freeport = require('freeport')

module.exports = createSlave

function genPWD() {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  var p = ''
  for (var i=0; i<10; i++) {
    p += chars[parseInt(Math.random() * chars.length)]
  }
  return p
}

function createSlave(docker, config, done) {
  var password = genPWD()

  freeport(function (er, port) {
    port = port + ''
    var options = {
      WorkingDir: '/data',
      start: {
        // Binds: [config.dataDir + ':/data'],
        PortBindings: {
          '22/tcp': [{HostPort: port}]
        }
      }
    }

    docker.run(config.image, ['/run.sh', password], null, options, function (err, data, container) {
      // do we need anything here?
    }).on('container', function (container) {
      console.log('[runner:docker] container id', container.id)
      done(null, spawnSSH.bind(null, docker.modem.host, port, password), container.kill.bind(container))
    })
  })
}

