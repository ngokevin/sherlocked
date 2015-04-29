/*
    Create database schema. Run as part of build/deploy process.
*/
var fs = require('fs');
var knex = require('knex');

var dbFile = process.env.SHERLOCKED_TEST_DB || './db.sqlite';

knex = knex({
    client: 'sqlite3',
    connection: {
        filename: dbFile
    },
});

if (fs.existsSync(dbFile)) {
    return;
}

knex.schema.createTable('build', function(build) {
    build.increments('id').primary();
    build.timestamp('created');
    build.integer('masterBuild').references('travisId');
    build.string('travisBranch');
    build.integer('travisId').unique();
    build.integer('travisPullRequest');
    build.string('travisRepoSlug');
}).then();

knex.schema.createTable('capture', function(capture) {
    capture.increments('id').primary();
    capture.integer('browserEnvId').references('browserEnv.id');
    capture.integer('buildId').references('build.travisId');
    capture.timestamp('created');
    capture.string('name');
    capture.string('sauceSessionId').unique();
}).then();

knex.schema.createTable('browserEnv', function(browserEnv) {
    browserEnv.increments('id').primary();
    browserEnv.string('name');
    browserEnv.string('platform');
    browserEnv.string('version');
}).then();
