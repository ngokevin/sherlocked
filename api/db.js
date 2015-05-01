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
    build.timestamps();
    build.integer('masterBuildId').references('build.id');
    build.string('travisBranch');
    build.string('travisCommit');
    build.integer('travisId').unique();
    build.integer('travisPullRequest');
    build.string('travisRepoSlug');
}).then();

knex.schema.createTable('capture', function(capture) {
    capture.increments('id').primary();
    capture.timestamps();
    capture.integer('browserEnvId').references('browserEnv.id');
    capture.integer('buildId').references('build.id');
    capture.string('name');
    capture.string('sauceSessionId');
}).then();

knex.schema.createTable('browserEnv', function(browserEnv) {
    browserEnv.increments('id').primary();
    browserEnv.string('name');
    browserEnv.string('platform');
    browserEnv.string('version');
}).then();
