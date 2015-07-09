'use strict'
var knex = require('knex');

var dbFile = process.env.SHERLOCKED_TEST_DB || '../db.sqlite';
knex = knex({
    client: 'sqlite3',
    connection: {
        filename: dbFile
    },
});

exports.up = function(next) {
  knex.schema.createTable('captureDiff', function(captureDiff) {
      captureDiff.increments('id').primary();
      captureDiff.integer('dimensionDifferenceHeight');
      captureDiff.integer('dimensionDifferenceWidth');
      captureDiff.string('mismatchPercentage');
      captureDiff.bool('isSameDimensions');
      captureDiff.string('sauceSessionId');
  }).then(next);
};

exports.down = function(next) {
  knex.schema.dropTable('captureDiff').then(next);
};
