'use strict';

const async = require('async');
const debug = require('debug')('strider-docker-runner:create-container');
const demuxer = require('./demuxer');
const es = require('event-stream');
const EventEmitter = require('events').EventEmitter;
const inspect = require('util').inspect;
const stream = require('stream');

function isImageLocally(docker, image, done) {
  const withoutTag = image.split(':')[0];
  const fullname = image === withoutTag ? `${image}:latest` : image;

  docker.listImages({filter: withoutTag}, function (err, images) {
    if (err) return done(err);

    const found = images.some(function (img) {
      return img.RepoTags && img.RepoTags.indexOf(fullname) >= 0;
    });

    done(null, found);
  });
}

function pull(docker, image, done) {
  docker.pull(image, (err, streamc) => {
    if (err) return done(err);

    streamc
      .pipe(es.map((data, cb) => {
        let json_data = null;

        try {
          json_data = JSON.parse(data.toString());
        } catch (error) {
          json_data = {
            type: 'stdout',
            data: data.toString()
          };
        }

        cb(null, json_data);
      }))
      .on('data', event => {
        debug(`pull event: ${inspect(event)}`);
      })
      .on('end', () => {
        done();
      });
  });
}

function create(createOptions, docker, config, done) {
  docker.createContainer(createOptions, (err, container) => {
    if (err) return done(new Error(err));

    debug('[runner:docker] container id', container.id);

    container.attach({
      stream: true, stdin: true,
      stdout: true, stderr: true
    }, attached);

    function attached(err, streamc) {
      if (err) return done(err);
      if (!streamc) return done(new Error('Failed to attach container stream'));

      // start, and wait for it to be done
      container.start(err => {
        if (err) return done(new Error(err));

        container.wait((err, data) => {
          debug('done with the container', err, data);
          container.stop(() => {
            debug('Stopped the container!');
          });
        });

        done(err, spawn.bind(null, streamc), kill);
      });
    }

    function kill(done) {
      container.remove({
        force: true, // Stop container and remove
        v: true // Remove any attached volumes
      }, done);
    }

    function spawn(streamc, command, args, options, done) {
      const proc = new EventEmitter();
      proc.kill = function () {
        streamc.write(`${JSON.stringify({type: 'kill'})}\n`);
      };
      proc.stdout = new stream.PassThrough();
      proc.stderr = new stream.PassThrough();
      proc.stdin = streamc;
      var stdout = new stream.PassThrough();
      var stderr = new stream.PassThrough();

      done(null, proc);

      const demux = demuxer(streamc, stdout, stderr);

      stdout
        .pipe(es.split())
        .pipe(es.parse())
        .pipe(es.mapSync(function (data) {
          debug('got an event', data);
          if (data.event === 'stdout') {
            proc.stdout.write(data.data);
          }
          if (data.event === 'stderr') {
            proc.stderr.write(data.data);
          }
          if (data.event === 'exit') {
            proc.emit('exit', data.code);
            streamc.removeListener('readable', demux);
            stdout.unpipe();
          }
        }));

      debug('running command', command);
      debug('with args', args);

      streamc.write(`${JSON.stringify({command: command, args: args, type: 'start'})}\n`);
    }
  });
}

module.exports = function (createOptions, docker, config, done) {
  async.waterfall([
    // First check if we already have the image stored locally.
    callback => {
      debug('Checking if image exists locally...');
      isImageLocally(docker, createOptions.Image, callback);
    },

    // If the image isn't stored locally, pull it.
    (isLocally, callback) => {
      if (isLocally) {
        debug('Image is already locally');
        return callback();
      }
      debug(`Unable to find image "${createOptions.Image}" locally`);
      pull(docker, createOptions.Image, callback);
    },

    // Create the container.
    () => {
      debug('Creating container...');
      create(createOptions, docker, config, done);
    }
  ]);
};
