'use strict'
var knex = require('./helper');


exports.up = function(next) {
  knex.schema.createTable('build', function(build) {
    build.increments('id').primary();
    build.timestamps();
    build.integer('masterBuildId').references('build.id');
    build.string('travisBranch');
    build.string('travisCommit');
    build.integer('travisId').unique();
    build.integer('travisPullRequest');
    build.string('travisRepoSlug');
  })
  .then(function() {
    return knex.schema.createTable('capture', function(capture) {
      capture.increments('id').primary();
      capture.timestamps();
      capture.integer('browserEnvId').references('browserEnv.id');
      capture.integer('buildId').references('build.id');
      capture.string('name');
      capture.string('sauceSessionId');
    })
  })
  .then(function() {
    return knex.schema.createTable('browserEnv', function(browserEnv) {
      browserEnv.increments('id').primary();
      browserEnv.string('name');
      browserEnv.string('platform');
      browserEnv.string('version');
    });
  })
  .then(function() {
    next();
  });
};


exports.down = function(next) {
  knex.schema.dropTable('build')
  .then(function() {
    return knex.schema.dropTable('capture');
  })
  .then(function() {
    return knex.schema.dropTable('browserEnv');
  })
  .then(next);
};
