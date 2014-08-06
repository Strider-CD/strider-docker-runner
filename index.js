
var Runner = require('./lib')

function create(emitter, config, context, done) {
  var runner = new Runner(emitter, config)
  runner.init(function (err) {
    if (err) {
      console.warn("Failed to initialize docker! Make sure permissions are right, config is right, etc.", err)
      return done(new Error('Cannot initialize docker'))
    }
    done(null, runner)
  })
}

module.exports = {
  create: create,
  config: {
    /** TODO use this
    method: String, // socket | http
    socketPath: String, // /var/run/docker.sock
    host: String, // 127.0.0.1
    post: Number, // 3000
    */
  }
}

