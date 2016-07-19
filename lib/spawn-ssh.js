var Connection = require('ssh2');
var shellQuote = require('shell-quote').quote;

function strings(env) {
  var out = {};
  for (var name in env) {
    out[name] = env[name] + '';
  }
  return out;
}

module.exports = spawnSSH;

function spawnSSH(host, port, password, command, args, options, done) {
  var conn = new Connection();
  setTimeout(function () {
    conn.connect({
      host: host,
      port: port,
      password: password,
      username: 'strider'
    });

    var ready = false;
    conn.on('ready', function () {
      // TODO: put the "cd /data" into the .bash_profile in the image
      var cmd = 'cd /data && ' + shellQuote([command].concat(args));
      conn.exec(cmd, {pty: true, env: strings(options.env)}, function (err, stream) {
        if (ready) return; // already called back
        ready = true;
        if (err) return done(err);
        stream.stdout = stream;
        stream.stdin = stream;
        done(null, stream);
      });
    });

    conn.on('error', function (err) {
      if (ready) return; // already called back
      ready = true;
      done(err);
    });
  }, 1000);
}

