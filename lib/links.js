
var async = require('async');
var debug = require('debug')('strider-docker-runner:links');
var linkLabels = ['com.stridercd.link', 'com.docker.compose.service'];

// Parse docker link syntax into sanitized name, alias pair
// e.g. redis:db  -> [redis, db]
//      mongo     -> [mongo, mongo]
//      /db_1     -> [db_1, db_1]
// Returns undefined on parse failure
function parseLink (link) {
  if (typeof link !== 'string') return;
  var parts = link.split(':');
  if (parts.length > 2 || !parts[0].length) return;
  var name = parts[0].replace(/^\//, '').trim();
  if (!name.length) return;
  var alias = parts.length === 1 ? name : parts[1].trim();
  if (!alias.length) return;
  return [name, alias];
}

// List all containers matching a label = value filter
function filterContainers (docker, label, value, done) {
  var opts = {filters: JSON.stringify({label: [label + '=' + value]})};
  docker.listContainers(opts, done);
}

// Find the first label with containers matching value and return the containers
// Errors are considered a non-match and are never returned.
// Callback is called with undefined if no labels matched any containers.
function findLabeledContainers (docker, labels, value, done) {
  // Hack reduce error to work like find
  async.reduce(labels, undefined, function (found, label, done) {
    filterContainers(docker, label, value, function (err, containers) {
      if (found) return done(found);
      if (containers && containers.length > 0) {
        debug('[runner:docker] found containers with label', label);
        return done(containers);
      }
      debug('[runner:docker] no containers with label', label);
      done();
    });
  }, function (containers) {
    done(undefined, containers);
  });
}

// Find the first label with a container matching value and return the container
// Errors are considered a non-match and are never returned.
// Callback is called with undefined if no labels matched any container.
function findLabeledContainer (docker, labels, value, done) {
  findLabeledContainers(docker, labels, value, function (err, containers) {
    if (containers && containers.length > 0) {
      return done(undefined, containers[0]);
    }
    done();
  });
}

// Resolves strider docker runner links into docker links using names and labels
// First checks for a container with the given name, then searches for
// the first container matching a set of predefined labels.
// Callback called with an error if the link cannot be parsed or no matching
// container is found.
function resolveLinks (docker, links, done) {
  async.map(links, function (link, done) {

    var parsed = parseLink(link);
    if (!parsed) return done(new Error('Invalid link: ' + link));

    function resolve (name) {
      var resolved = [name, parsed[1]].join(':');
      debug('[runner:docker] resolved link', link, resolved);
      return done(undefined, resolved);
    }

    // Try to find a container by name (or id)
    var name = parsed[0];
    docker.getContainer(name).inspect(function (err, container) {
      if (!err && container) return resolve(name);
      debug('[runner:docker] no container with name', name);
      // Try to find a container by label
      findLabeledContainer(docker, linkLabels, name, function (err, container) {
        if (!err && container) return resolve(container.Id);
        debug('[runner:docker] no container with label', name);
        done(new Error('No container found for link: ' + link));
      });
    });
  }, done);
}

module.exports = {
  parseLink: parseLink,
  filterContainers: filterContainers,
  findLabeledContainers: findLabeledContainers,
  findLabeledContainer: findLabeledContainer,
  resolveLinks: resolveLinks
};
