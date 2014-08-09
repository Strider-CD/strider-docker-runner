
var init = require('../lib/init')
var createSlave = require('../lib/slave')

if (!process.env.DOCKER_IP) {
  console.log('Need to specify DOCKER_IP and DOCKER_PORT')
  process.exit(1)
}

function run(spawn, command, args, done) {
  spawn(command, args, {}, function (err, proc) {
    if (err) {
      throw err
    }
    proc.stderr.on('data', function (data) {
      console.log('[err]', data.toString())
    })
    proc.stdout.on('data', function (data) {
      console.log('[out]', data.toString())
    })
    proc.on('exit', function (code) {
      console.log('[exit] with', code)
      done(code)
    })
  })
}

init(null, null, function (err, docker) {
  createSlave(docker, {}, function (err, spawn, kill) {
    if (err) {
      throw err
    }
    var command = 'git'
    var args = ['clone', 'https://github.com/notablemind/loco.git', '.']
    var command = 'sh'
    var args = ['-c', 'echo ho && sleep 30 && echo hi']
    var args = ['-c', 'git clone https://github.com/notablemind/loco.git . && ls']
    run(spawn, command, args, function () {
      run(spawn, 'echo', ['hello'], function () {
        process.exit(0)
      })
    })
  })
})
