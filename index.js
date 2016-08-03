'use strict';

const debug = require('debug')('strider-docker-runner');
const runDocker = require('./lib/run');
const Runner = require('strider-simple-runner').Runner;

function create(emitter, config, context, done) {
  config = config || {};
  config.processJob = runDocker;
  var runner = new Runner(emitter, config);
  runner.id = 'docker';

  debug('Overriding runner.processJob');
  runner.processJob = function (job, config, next) {
    debug('Running docker job...');

    var now = new Date();
    var self = this;

    var oldnext = next;
    next = function () {
      delete self.callbackMap[job._id];
      oldnext();
    };
    this.callbackMap[job._id] = next;

    var dirs = {
      base: '/home/strider/workspace',
      data: '/home/strider/workspace',
      cache: '/home/strider/workspace'
    };

    self.jobdata.get(job._id).started = now;
    self.emitter.emit('browser.update', job.project.name, 'job.status.started', [job._id, now]);
    debug(`[runner:${self.id}] Job started. Project: ${job.project.name} Job ID: ${job._id}`);
    debug('Initializing plugins...');
    self.plugins(job.project.creator, config, job, dirs, function (err, workers) {
      if (err) {
        var jobdata = self.jobdata.pop(job._id);
        if (!jobdata) return next(null);
        jobdata.errored = true;
        jobdata.error = {
          message: err.message,
          stack: err.stack
        };
        // self.emitter.emit('browser.update', job.project.name, 'job.status.errored', [job._id, jobdata.error])
        delete jobdata.data;
        jobdata.finished = new Date();
        self.emitter.emit('job.done', jobdata);
        debug(`[runner:${self.id}] Job done with error. Project: ${job.project.name} Job ID: ${job._id}`);
        next(null);
        return;
      }
      var env = {};
      if (config.envKeys) {
        env.STRIDER_SSH_PUB = config.pubkey;
        env.STRIDER_SSH_PRIV = config.privkey;
      }
      self.config.processJob(job, workers.provider, workers.jobplugins, {
        cachier: Function.prototype,
        baseDir: dirs.base,
        dataDir: dirs.data,
        cacheDir: dirs.cache,
        io: self.config.io,
        branchConfig: config,
        env: env,
        log: debug,
        error: debug
      }, function (err) {
        var jobdata = self.jobdata.pop(job._id);
        if (!jobdata) return next(null);

        if (err) {
          jobdata.errored = true;
          jobdata.error = {
            message: err.message,
            stack: err.stack
          };
          self.emitter.emit('browser.update', job.project.name, 'job.status.errored', [job._id, jobdata.error]);
          debug(`[runner:${self.id}] Job done with error. Project: ${job.project.name} Job ID: ${job._id}`);
        }

        delete jobdata.data;
        jobdata.finished = new Date();
        self.emitter.emit('job.done', jobdata);
        debug(`[runner:${self.id}] Job done without error. Project: ${job.project.name} Job ID: ${job._id}`);
        next(null);
      });
    });
  };

  debug('Fixing job queue handler');
  runner.queue.handler = runner.processJob.bind(runner);

  runner.loadExtensions(context.extensionPaths, function (err) {
    done(err, runner);
  });
}

module.exports = {
  create: create,
  config: {
    host: String,
    port: Number,
    socketPath: String,
    dns: String,
    docker_host: String,
    docker_volumeBinds: String,
    docker_links: String
  }
};
