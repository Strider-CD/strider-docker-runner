var expect = require('chai').expect
  , dockerUtil = require('../../lib/docker_util');

describe("dockerUtil#normalizeOptions()", function () {
  var fn = dockerUtil.normalizeOptions;
  describe("passing in nothing", function () {
    it("defaults to default socket path", function () {
      expect(fn({}, {})).to.deep.eq({
        socketPath: "/var/run/docker.sock"
      })
    });
  });
  describe("using environment variables DOCKER_IP and DOCKER_PORT", function () {
    it("returns expected dockerode connection structure", function () {
      var out = fn({}, {
        DOCKER_IP: "127.0.0.1",
        DOCKER_PORT: "4243"
      });
      expect(out).to.deep.eq({
        host: "127.0.0.1",
        port: "4243"
      })
    });
  });

  describe("using environment variable DOCKER_HOST", function () {
    it("understands http://127.0.0.1:4243", function () {
      var out = fn({}, {DOCKER_HOST: "http://127.0.0.1:4243"});
      expect(out).to.deep.eq({
        host: "127.0.0.1",
        port: 4243
      })
    });
    it("understands unix:///var/run/docker.sock", function () {
      var out = fn({}, {DOCKER_HOST: "unix:///var/run/docker.sock"});
      expect(out).to.deep.eq({
        socketPath: "/var/run/docker.sock"
      })
    });
    it("understands tcp://127.0.0.1:4243", function () {
      var out = fn({}, {DOCKER_HOST: "tcp://127.0.0.1:4243"});
      expect(out).to.deep.eq({
        host: "127.0.0.1",
        port: 4243
      })
    });
  });
});
