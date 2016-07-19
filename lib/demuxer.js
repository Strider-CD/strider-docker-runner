/**
 * Taken from the docker-modem project, with a slight change to allow for
 * later "removeListener"
 */

module.exports = demuxer;

function demuxer(stream, stdout, stderr) {
  var header = null;

  function demux() {
    header = header || stream.read(8);
    while (header !== null) {
      var type = header.readUInt8(0);
      var payload = stream.read(header.readUInt32BE(4));
      if (payload === null) break;
      if (type == 2) {
        stderr.write(payload);
      } else {
        stdout.write(payload);
      }
      header = stream.read(8);
    }
  }

  stream.on('readable', demux);
  return demux;
}

