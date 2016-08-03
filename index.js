'use strict';

const debug = require('debug')('strider-docker-runner');
const initDocker = require('./lib/init');
const runDocker = require('./lib/run');
const Runner = require('strider-simple-runner').Runner;

function create(emitter, config, context, done) {
  config = config || {};
  config.processJob = runDocker;

  const runner = new Runner(emitter, config);
  runner.id = 'docker';

  debug('Overriding runner.processJob');
  runner.processJob = function processJob(job, config, next) {
    debug('Running docker job...');

    const self = this;
    const now = new Date();

    const oldnext = next;
    next = () => {
      delete self.callbackMap[job._id];
      oldnext();
    };
    this.callbackMap[job._id] = next;

    const dirs = {
      base: '/home/strider/workspace',
      data: '/home/strider/workspace',
      cache: '/home/strider/workspace'
    };

    self.jobdata.get(job._id).started = now;
    self.emitter.emit('browser.update', job.project.name, 'job.status.started', [job._id, now]);
    debug(`[runner:${self.id}] Job started. Project: ${job.project.name} Job ID: ${job._id}`);
    debug('Initializing plugins...');
    self.plugins(job.project.creator, config, job, dirs, (err, workers) => {
      if (err) {
        let jobdata = self.jobdata.pop(job._id);
        if (!jobdata) return next(err);
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
        return next(err);
      }

      const env = {};
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
      }, err => {
        let jobdata = self.jobdata.pop(job._id);
        if (!jobdata) return next(err);

        if (err) {
          jobdata.errored = true;
          jobdata.error = {
            message: err.message,
            stack: err.stack
          };
          self.emitter.emit('browser.update', job.project.name, 'job.status.errored', [job._id, jobdata.error]);
          debug(`[runner:${self.id}] Job done with error. Project: ${job.project.name} Job ID: ${job._id}`);
          return next(err);
        }

        delete jobdata.data;
        jobdata.finished = new Date();
        self.emitter.emit('job.done', jobdata);
        debug(`[runner:${self.id}] Job done without error. Project: ${job.project.name} Job ID: ${job._id}`);
        return next();
      });
    });
  };

  debug('Fixing job queue handler');
  runner.queue.handler = runner.processJob.bind(runner);

  runner.loadExtensions(context.extensionPaths, err => {
    done(err, runner);
  });
}

/**
 * List all running containers and check if their names are prefixed with "strider-".
 * If so, then they were probably started during a previous run and were not shut down properly.
 * In that case, we try to clean them up now.
 *
 * Note that this process does and can not know about containers that were started on any other but
 * the default host. Meaning with a different host given in the job configuration.
 */
function cleanup() {
  debug('Cleaning up...');
  initDocker({}, (err, docker) => {
    if (err) {
      debug(err);
      return;
    }

    docker.listContainers((err, containers) => {
      if (err) {
        debug(err);
        return;
      }

      debug(`Found ${containers.length} running containers.`);

      containers.forEach(function (containerInfo) {
        if (!containerInfo.Names[0].match(/^\/strider-/)) {
          debug(`Container "${containerInfo.Names[0]}" is not a strider runner. Skipping.`);
          return;
        }

        debug(`Attempting to clean up container "${containerInfo.Names[0]}"...`);
        docker.getContainer(containerInfo.Id)
          .remove({
            force: true, // Stop container and remove
            v: true // Remove any attached volumes
          }, err => {
            if (err) {
              debug(err);
              return;
            }

            debug(`Cleaned up container "${containerInfo.Names[0]}".`);
          });
      });
    });
  });
}
// Cleanup on initial module load.
cleanup();

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
