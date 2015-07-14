'use strict'
var knex = require('./helper');


exports.up = function(next) {
  knex.schema.createTable('captureDiff', function(captureDiff) {
    captureDiff.increments('id').primary();
    captureDiff.integer('captureId').references('build.id');
    captureDiff.integer('dimensionDifferenceHeight');
    captureDiff.integer('dimensionDifferenceWidth');
    captureDiff.string('mismatchPercentage');
    captureDiff.bool('isSameDimensions');
  })
  .then(function() {
    next();
  });
};


exports.down = function(next) {
  knex.schema.dropTable('captureDiff')
  .then(next);
};
