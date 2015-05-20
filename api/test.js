var fs = require('fs');

var assert = require('assert');
var extend = require('extend');
var Promise = require('es6-promise').Promise;
var request = require('supertest');

var app = require('./index');
var knex = require('knex')(require('./config'));


function prefix(url) {
    return '/api' + url;
}


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
            .get(prefix('/'))
            .expect(200, done);
    });
});


describe('GET /builds/', function() {
    it('returns 0 builds', function(done) {
        request(app.app).get(prefix('/builds/'))
        .end(function(err, res) {
            assert.equal(res.body.length, 0);
            done();
        });
    });

    it('returns 1 build', function(done) {
        createBuilds([buildFactory()]).then(function() {
            request(app.app).get(prefix('/builds/'))
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
            request(app.app).get(prefix('/builds/'))
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
        request(app.app).post(prefix('/builds/'))
            .send(buildFactory())
            .expect(201, function() {
                getBuild(function(build) {
                    assert.equal(build.travisId, 221);
                    done();
                });
            });
    });

    it('attaches latest master build', function(done) {
        // Create some master builds.
        var masterBuildCreated = new Promise(function(resolve) {
            createBuilds([
                buildFactory({travisBranch: 'master', travisId: 1}),
                buildFactory({travisBranch: 'master', travisId: 2}),
                buildFactory({travisBranch: 'master', travisId: 3}),
            ]).then(function() {
                var masterBuild = buildFactory({travisBranch: 'master',
                                                travisId: 4});
                setTimeout(function() {
                    createBuilds([masterBuild]).then(function() {
                        resolve(masterBuild);
                    });
                }, 10);
            });
        });

        masterBuildCreated.then(function(masterBuild) {
            request(app.app).post(prefix('/builds/'))
                .send(buildFactory({travisId: 222}))
                .expect(201, function() {
                    getBuild(function(build) {
                        assert.equal(build.masterBuild.travisId, 4);
                        done();
                    }, 4);
                });
        });
    });
});


describe('GET /builds/:buildId', function() {
    it('returns a build', function(done) {
        function assertBuild(build) {
            assert.equal(build.travisId, 221);
            assert.equal(build.travisBranch, 'updateHatStyle');
            assert.equal(build.travisCommit, '01189998819991197253');
            assert.equal(build.travisPullRequest, 221);
            assert.equal(build.travisRepoSlug,
                         'sherlocked/adlerjs');

            assert.equal(build.captures.length, 0);
            assert.equal(build.masterBuild, undefined);
            done();
        }

        createBuilds([buildFactory()]).then(function() {
            request(app.app).get(prefix('/builds/221'))
                .end(function(err, res) {
                    assertBuild(res.body);
                });
        });
    });

    it('returns a build with captures', function(done) {
        function assertBuild(build) {
            assert.equal(build.captures.length, 1);
            assert.equal(build.captures[0].browserEnv.name, 'firefox');
            assert.equal(build.captures[0].browserEnv.platform, 'OS X 10.9');
            assert.equal(build.captures[0].browserEnv.version, '40');
            assert.equal(build.captures[0].captures.watsonsButt.name,
                         'watsonsButt');
            assert.equal(build.captures[0].captures.watsonsButt.sauceSessionId,
                         '221B');
            assert.equal(build.captures[0].captures.watsonsButt.src,
                         '/img/captures/221B.png');
            assert.equal(Object.keys(build.captures[0].masterCaptures).length,
                         0);
            done();
        }

        createBuilds([buildFactory()]).then(function() {
            request(app.app).post(prefix('/builds/221/captures/'))
                .send(captureFactory())
                .end(function(err, res) {
                    request(app.app).get(prefix('/builds/221'))
                        .end(function(err, res) {
                            assertBuild(res.body);
                        });
                });
        });
    });

    it('returns a build w/ master build captures w/ same env', function(done) {
        function assertBuild(build) {
            var captureGroup = build.captures[0];
            var captures = captureGroup.captures;
            var masterCaptures = captureGroup.masterCaptures;

            assert.equal(captureGroup.browserEnv.name, 'firefox');
            assert.equal(captureGroup.browserEnv.version, '40');
            assert.equal(captureGroup.browserEnv.platform,
                         'OS X 10.9');

            assert.equal(Object.keys(captures).length, 1);
            assert.equal(Object.keys(masterCaptures).length, 1);

            assert.equal(captures.watsonsButt.sauceSessionId, 'abc');
            assert.equal(masterCaptures.watsonsButt.sauceSessionId, '221B');
            done();
        }

        var masterBuild = buildFactory({travisBranch: 'master',
                                        travisId: 123});
        createBuilds([buildFactory(), masterBuild]).then(function() {
            request(app.app).post(prefix('/builds/123/captures/'))
                .send(captureFactory())
                .end(function(err, res) {
                    request(app.app).post(prefix('/builds/221/captures/'))
                        .send(captureFactory({sauceSessionId: 'abc'}))
                        .end(function(err, res) {
                            request(app.app).get(prefix('/builds/221'))
                                .end(function(err, res) {
                                    assertBuild(res.body);
                                });
                        });
                });
        });
    });
});


describe('POST /builds/:id/captures/', function() {
    it('creates capture on build', function(done) {
        createBuilds([buildFactory()]).then(function() {
            request(app.app).post(prefix('/builds/221/captures/'))
                .send(captureFactory())
                .expect(201, function() {
                    getBuild(function(build) {
                        assert.equal(build.captures.length, 1);
                        var captureGroup = build.captures[0];
                        assert.equal(Object.keys(captureGroup.captures).length,
                                     1);
                        done();
                    });
                });
        });
    });

    it('creates multiple captures with same browserEnv', function(done) {
        function assertBuild(build) {
            assert.equal(build.captures.length, 1);
            var captureGroup = build.captures[0];
            assert.equal(Object.keys(captureGroup.captures).length, 2);
            done();
        }

        createBuilds([buildFactory()]).then(function() {
            request(app.app).post(prefix('/builds/221/captures/'))
                .send(captureFactory({browserVersion: undefined}))
                .end(function(err, res) {
                    request(app.app).post(prefix('/builds/221/captures/'))
                        .send(captureFactory({browserVersion: undefined,
                                              name: 'watsonsFace',
                                              sauceSessionId: '221C'}))
                        .end(function(err, res) {
                            getBuild(assertBuild);
                        });
                });
        });
    });

    it('creates multiple captures with different browserEnv', function(done) {
        function assertBuild(build) {
            assert.equal(build.captures.length, 2);
            var firefoxGroup = build.captures[0];
            assert.equal(Object.keys(firefoxGroup.captures).length, 1);
            var chromeGroup = build.captures[1];
            assert.equal(Object.keys(chromeGroup.captures).length, 1);
            done();
        }

        createBuilds([buildFactory()]).then(function() {
            request(app.app).post(prefix('/builds/221/captures/'))
                .send(captureFactory())
                .end(function(err, res) {
                    request(app.app).post(prefix('/builds/221/captures/'))
                        .send(captureFactory({
                            browserName: 'chrome',
                            name: 'watsonsFace',
                            sauceSessionId: '221C'
                        }))
                        .end(function(err, res) {
                            getBuild(assertBuild);
                        });
                });
        });
    });
});


function getBuild(cb, id) {
    request(app.app).get(prefix('/builds/') + (id || 221))
        .end(function(err, res) {
            cb(res.body);
        });
}


function createBuilds(builds) {
    // Create Builds via POST requests to the API.
    return Promise.all(builds.map(function(build) {
        return new Promise(function(resolve) {
            request(app.app).post(prefix('/builds/'))
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
        travisCommit: '01189998819991197253',
        travisId: 221,
        travisPullRequest: 221,
        travisRepoSlug: 'sherlocked/adlerjs'
    }, extendObj);
}


var captureCounter = 0;
function captureFactory(extendObj) {
    // Generate Build.
    return extend({
        browserName: 'firefox',
        browserPlatform: 'OS X 10.9',
        browserVersion: '40',
        image: 'data:image/png;base64,R0lGODlhDwAPAKECAAAAzMzM',
        name: 'watsonsButt',
        sauceSessionId: '221B',
    }, extendObj);
}
