'use strict';

const _ = require('lodash');
const createSlave = require('./slave');
const debug = require('debug')('strider-docker-runner:run');
const initDocker = require('./init');
const processJob = require('strider-runner-core').process;
const util = require('util');

module.exports = function (job, provider, plugins, config, next) {
  initDocker(config.branchConfig.runner.config, (err, docker) => {
    if (err)
      return next(new Error(`Cannot connect to Docker with options ${util.format(err.connectOptions)}\nActual Error: ${err.stack}`));

    // Construct the environment for the container, by merging all environment variable declarations of all plugins.
    const env = [];
    _.each(plugins, plugin => {
      if (plugin.env) {
        _.each(plugin.env, (value, key) => {
          env.push(`${key}=${value}`);
        });
      }
    });

    const slaveConfig = _.extend({
      id: job._id,
      dataDir: config.dataDir,
      image: 'strider/strider-docker-slave',
      env: env
    }, config.branchConfig.runner.config);
    slaveConfig.image = slaveConfig.image || 'strider/strider-docker-slave';

    if (slaveConfig.dns && slaveConfig.dns.length > 6) {
      slaveConfig.dns = slaveConfig.dns.split(',');
    }

    if (slaveConfig.docker_volumeBinds && slaveConfig.docker_volumeBinds.indexOf(',') > -1) {
      slaveConfig.docker_volumeBinds = slaveConfig
        .docker_volumeBinds
        .split(',')
        .map(volBinding => {
          return volBinding.trim();
        });
    }

    if (slaveConfig.docker_links) {
      slaveConfig.docker_links = slaveConfig.docker_links.trim();
      if (slaveConfig.docker_links.indexOf(',') > -1) {
        slaveConfig.docker_links = slaveConfig
          .docker_links
          .split(',')
          .map(link => {
            return link.trim();
          });
      } else if (slaveConfig.docker_links) {
        slaveConfig.docker_links = [slaveConfig.docker_links];
      }
    }
    slaveConfig.docker_links = slaveConfig.docker_links || [];

    config.io.emit('job.status.command.comment', job._id, {
      comment: `Creating docker container from ${slaveConfig.image}`,
      plugin: 'docker',
      time: new Date()
    });

    createSlave(docker, slaveConfig, (err, spawn, kill) => {
      if (err) return next(err);

      // spawn is a function that allows us to execute shell commands inside the docker container.
      config.spawn = spawn;

      processJob(job, provider, plugins, config, err => {
        if (err) next(new Error(err));

        const args = arguments;
        kill(err => {
          if (err) debug('Failed to kill docker container!', err);
          next.apply(this, args);
        });
      });
    });
  });
};
