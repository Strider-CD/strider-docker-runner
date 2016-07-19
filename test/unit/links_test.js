var expect = require('chai').expect
  , links = require('../../lib/links');

describe("links#parseLink()", function () {
  var fn = links.parseLink;

  it('returns undefined for invalid links', function () {
    expect(fn()).to.be.undefined;
    expect(fn('')).to.be.undefined;
    expect(fn(':')).to.be.undefined;
    expect(fn('a:')).to.be.undefined;
    expect(fn(':b')).to.be.undefined;
    expect(fn('a:b:c')).to.be.undefined;
  });

  it('uses the name as alias when no alias given', function () {
    expect(fn('abc')).to.deep.equal(['abc', 'abc']);
  });

  it('splits a name:alias pair', function () {
    expect(fn('a:b')).to.deep.equal(['a', 'b']);
  });

  it('strips the leading slash from the name', function () {
    expect(fn('/a:b')).to.deep.equal(['a', 'b']);
  });
});

describe("links#filterContainers()", function () {

  it('calls docker.listContainers with a label/value filter', function (done) {
    var docker = {
      listContainers: function (opts, done) {
        expect(opts).to.deep.equal({filters: '{"label":["a=b"]}'});
        done();
      }
    };
    links.filterContainers(docker, 'a', 'b', done);
  });
});

describe("links#findLabeledContainers()", function () {

  it('swallows errors', function (done) {
    var docker = {
      listContainers: function (opts, done) {
        done(new Error());
      }
    };
    links.findLabeledContainers(docker, ['a'], 'b', done);
  });

  it('returns undefined if no containers match', function (done) {
    var docker = {
      listContainers: function (opts, done) {
        done(null, []);
      }
    };
    links.findLabeledContainers(docker, ['a'], 'b', function (err, containers) {
      expect(err).to.be.undefined;
      expect(containers).to.be.undefined;
      done();
    });
  });

  it('finds the first label with containers matching the value and returns the containers', function (done) {
    var docker = {
      listContainers: function (opts, done) {
        if (opts.filters !== '{"label":["b=v"]}') return done(null, []);
        done(null, ['a', 'b']);
      }
    };
    links.findLabeledContainers(docker, ['a', 'b', 'c'], 'v', function (err, containers) {
      expect(err).to.be.undefined;
      expect(containers).to.deep.equal(['a', 'b']);
      done();
    });
  });

  it('does not ask docker for containers after it finds a match', function (done) {
    var calls = 0;
    var docker = {
      listContainers: function (opts, done) {
        calls++;
        done(null, ['a', 'b']);
      }
    };
    links.findLabeledContainers(docker, ['a', 'b', 'c'], 'v', function (err, containers) {
      expect(err).to.be.undefined;
      expect(containers).to.deep.equal(['a', 'b']);
      expect(calls).to.equal(1);
      done();
    });
  });
});

describe("links#findLabeledContainer()", function () {

  it('returns undefined if no containers match', function (done) {
    var docker = {
      listContainers: function (opts, done) {
        done(null, []);
      }
    };
    links.findLabeledContainer(docker, ['a'], 'b', function (err, container) {
      expect(err).to.be.undefined;
      expect(container).to.be.undefined;
      done();
    });
  });

  it('returns the first matching container', function (done) {
    var docker = {
      listContainers: function (opts, done) {
        done(null, ['a', 'b']);
      }
    };
    links.findLabeledContainer(docker, ['a'], 'v', function (err, containers) {
      expect(err).to.be.undefined;
      expect(containers).to.equal('a');
      done();
    });
  });
});

describe("links#resolveLinks()", function () {

  it('returns an error if no containers match a link', function (done) {
    var docker = {
      listContainers: function (opts, done) {
        done(null, []);
      },
      getContainer: function (name) {
        return {
          inspect: function (done) {
            return done(new Error());
          }
        }
      }
    };
    links.resolveLinks(docker, ['a'], function (err, links) {
      expect(err).to.be.an.instanceof(Error);
      done();
    });
  });

  it('resolves links by name', function (done) {
    var docker = {
      listContainers: function (opts, done) {
        done(null, []);
      },
      getContainer: function (name) {
        return {
          inspect: function (done) {
            return done(null, name);
          }
        }
      }
    };
    links.resolveLinks(docker, ['a', 'b'], function (err, links) {
      expect(err).to.be.undefined;
      expect(links).to.deep.equal(['a:a', 'b:b']);
      done();
    });
  });

  it('resolves links with the com.stridercd.link label', function (done) {
    var docker = {
      listContainers: function (opts, done) {
        var parts = JSON.parse(opts.filters).label[0].split('=');
        var label = parts[0];
        var value = parts[1];
        if (label === 'com.stridercd.link') return done(null, [{Id: value}]);
        done(null, []);
      },
      getContainer: function (name) {
        return {
          inspect: function (done) {
            return done();
          }
        }
      }
    };
    links.resolveLinks(docker, ['a', 'b'], function (err, links) {
      expect(err).to.be.undefined;
      expect(links).to.deep.equal(['a:a', 'b:b']);
      done();
    });
  });

  it('resolves links with the com.docker.compose.service label', function (done) {
    var docker = {
      listContainers: function (opts, done) {
        var parts = JSON.parse(opts.filters).label[0].split('=');
        var label = parts[0];
        var value = parts[1];
        if (label === 'com.docker.compose.service') return done(null, [{Id: value}]);
        done(null, []);
      },
      getContainer: function (name) {
        return {
          inspect: function (done) {
            return done();
          }
        }
      }
    };
    links.resolveLinks(docker, ['a', 'b'], function (err, links) {
      expect(err).to.be.undefined;
      expect(links).to.deep.equal(['a:a', 'b:b']);
      done();
    });
  });

});
