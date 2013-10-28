
var EventEmitter2 = require('EventEmitter2')

module.exports = StdEmitter

function StdEmitter(config) {
  EventEmitter2.call(this, config)
  this.read = null
  this.write = null
  this.toWrite = []
}

util.inherits(StdEmitter, EventEmitter2)

_.extend(StdEmitter.prototype, {
  attach: function (write, read) {
    this.read = read
    read.setEncoding('utf8')
    this.buffer = ''
    var self = this
    read.on('data', function (data) {
      self.buffer += data;
      if (self.buffer.indexOf('\n') === -1) return
      var lines = self.buffer.split('\n')
      self.buffer = lines.pop()
      lines.map(self.handleBody)
    })
    this.write = write
    this.toWrite.map(function (body) {
      write.write(body + '\n')
      write.flush()
    })
    this.toWrite = []
  },
  handleBody: function (body) {
    try {
      data = JSON.parse(body)
    } catch (e) {
      return console.error('Got body from StdEmitter, but it was malformed: ', body)
    }
    EventEmitter2.emit.apply(this, [data.type].concat(data.args || []))
  },
  emit: function (type) {
    var args = [].slice.call(arguments, 1)
      , body = JSON.stringify({type: type, args: args})
    if (!this.stdout) {
      return this.toWrite.push(body)
    }
    this.write.write(body + '\n')
    this.write.flush()
  },
})
