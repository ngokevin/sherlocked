var fs = require('fs');

var assert = require('assert');
var extend = require('extend');
var Promise = require('es6-promise').Promise;
var request = require('supertest');

var app = require('./app');
var knex = require('knex')(require('./config'));


if (!fs.existsSync(process.env.SHERLOCKED_TEST_DB)) {
    require('./db');
}


beforeEach(function(done) {
    // Teardown and rebuild database.
    Promise.all([
        knex('build').truncate(),
        knex('browserEnv').truncate(),
        knex('capture').truncate()
    ]).then(function() {
        done();
    });
});


describe('GET /', function() {
    it('is OK', function(done) {
        request(app.app)
            .get('/')
            .expect(200, done);
    });
});


describe('GET /builds/', function() {
    it('returns 0 builds', function(done) {
        request(app.app).get('/builds/')
        .end(function(err, res) {
            assert.equal(res.body.length, 0);
            done();
        });
    });

    it('returns 1 build', function(done) {
        createBuilds([buildFactory()]).then(function() {
            request(app.app).get('/builds/')
                .end(function(err, res) {
                    assert.equal(res.body[0].travisId, 221);
                    done();
                });
        });
    });

    it('returns 2 builds', function(done) {
        var build1 = buildFactory();
        var build2 = buildFactory({travisId: 239});
        createBuilds([build1, build2]).then(function() {
            request(app.app).get('/builds/')
                .end(function(err, res) {
                    assert.equal(res.body[0].travisId, 221);
                    assert.equal(res.body[1].travisId, 239);
                    done();
                });
        });
    });
});


describe('POST /builds/', function() {
    it('creates a builds', function(done) {
        request(app.app).post('/builds/')
            .send(buildFactory())
            .expect(201, function() {
                getBuild(function(build) {
                    assert.equal(build.travisId, 221);
                    done();
                });
            });
    });

    it('attaches master build', function(done) {
        var masterBuild = buildFactory({travisBranch: 'master'});

        createBuilds([masterBuild]).then(function() {
            request(app.app).post('/builds/')
                .send(buildFactory({travisId: 222}))
                .expect(201, function() {
                    getBuild(function(build) {
                        assert.equal(build.travisId, 221);
                        done();
                    });
                });
        });
    });
});


describe('GET /builds/:buildId', function() {
    it('returns a build', function(done) {
        createBuilds([buildFactory()]).then(function() {
            request(app.app).get('/builds/221')
                .end(function(err, res) {
                    assert.equal(res.body.travisId, 221);
                    assert.equal(res.body.travisBranch, 'updateHatStyle');
                    assert.equal(res.body.travisPullRequest, 221);
                    assert.equal(res.body.travisRepoSlug,
                                 'sherlocked/adlerjs');
                    assert.equal(res.body.captures.length, 0);
                    assert.ok(res.body.masterBuild);
                    done();
                });
        });
    });
});


describe('POST /builds/:id/captures/', function() {
    it('creates capture on build', function(done) {
        createBuilds([buildFactory()]).then(function() {
            request(app.app).post('/builds/221/captures/')
                .send(captureFactory())
                .expect(201, function() {
                    getBuild(function(build) {
                        var capture = build.captures[0];
                        assert.equal(capture.browserEnv.name, 'firefox');
                        assert.equal(capture.browserEnv.version, '40');
                        assert.equal(capture.browserEnv.platform, 'OS X 10.9');
                        assert.equal(capture.name, 'watsonsButt');
                        assert.equal(capture.sauceSessionId, '221B');
                        done();
                    });
                });
        });
    });

    it('creates multiple captures on build', function(done) {
        createBuilds([buildFactory()]).then(function() {
            request(app.app).post('/builds/221/captures/')
                .send(captureFactory())
                .end(function(err, res) {
                    request(app.app).post('/builds/221/captures/')
                        .send(captureFactory({name: 'watsonsFace',
                                              sauceSessionId: '221C'}))
                        .end(function(err, res) {
                            getBuild(function(build) {
                                console.log(build);
                                assert.equal(build.captures.length, 2);
                                done();
                            });
                        });
                });
        });
    });
});


function getBuild(cb, id) {
    request(app.app).get('/builds/' + (id || 221))
        .end(function(err, res) {
            cb(res.body);
        });
}


function createBuilds(builds) {
    // Create Builds via POST requests to the API.
    return Promise.all(builds.map(function(build) {
        return new Promise(function(resolve) {
            request(app.app).post('/builds/')
                .send(build)
                .end(function(err, res) {
                    resolve(res.body);
                });
        });
    }));
}


function buildFactory(extendObj) {
    // Generate Build.
    return extend({
        travisBranch: 'updateHatStyle',
        travisId: 221,
        travisPullRequest: 221,
        travisRepoSlug: 'sherlocked/adlerjs'
    }, extendObj);
}


function captureFactory(extendObj) {
    // Generate Build.
    return extend({
        browserName: 'firefox',
        browserPlatform: 'OS X 10.9',
        browserVersion: '40',
        name: 'watsonsButt',
        sauceSessionId: '221B'
    }, extendObj);
}
