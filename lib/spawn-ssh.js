
var Connection = require('ssh2')
  , shellQuote = require('shell-quote').quote

function strings(env) {
  var out = {}
  for (var name in env) {
    out[name] = env[name] + ''
  }
  return out
}

module.exports = spawnSSH

function spawnSSH(host, port, password, command, args, options, done) {
  // console.log('connect', host, port, password)
  var conn = new Connection()
  setTimeout(function () {
  conn.connect({
    host: host,
    port: port,
    password: password,
    username: 'strider'
  })

  conn.on('ready', function () {
    var cmd = 'cd /data && ' + shellQuote([command].concat(args))
    // console.log('exec', cmd, options.env)
    conn.exec(cmd, {pty: true, env: strings(options.env)}, function (err, stream) {
      if (err) return done(err)
      stream.stdout = stream
      stream.stdin = stream
      done(null, stream)
    })
  })

  conn.on('error', function (err) {
    done(err)
  })
  }, 1000);
}

