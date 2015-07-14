import fs from 'fs';

import assert from 'assert';
import extend from 'extend';
import migrate from 'migrate';
import request from 'supertest';

import app from '../index';
import config from '../config';


const knex = require('knex')(config);


function prefix(url) {
  return '/api' + url;
}


beforeEach(function(done) {
  // Teardown and rebuild database.
  this.timeout(10000);

  Promise.all([
    knex('build').truncate(),
    knex('browserEnv').truncate(),
    knex('capture').truncate(),
    knex('captureDiff').truncate()
  ]).then(() => {
    done();
  });
});


describe('GET /', () => {
  it('is OK', done => {
    request(app.app)
      .get(prefix('/'))
      .expect(200, done);
  });
});


describe('GET /builds/', () => {
  it('returns 0 builds', done => {
    request(app.app)
    .get(prefix('/builds/'))
    .end((err, res) => {
      assert.equal(res.statusCode, 404);
      done();
    });
  });

  it('returns 1 build', done => {
    createBuilds([buildFactory()]).then(() => {
      request(app.app)
      .get(prefix('/builds/'))
        .end((err, res) => {
          assert.equal(res.body[0].travisId, 221);
          done();
        });
    });
  });

  it('returns 2 builds', done => {
    var build1 = buildFactory();
    var build2 = buildFactory({travisId: 239});
    createBuilds([build1, build2]).then(() => {
      request(app.app)
        .get(prefix('/builds/'))
        .end((err, res) => {
          // Order by created_by DESC.
          assert.equal(res.body[0].travisId, 239);
          assert.equal(res.body[1].travisId, 221);
          done();
        });
    });
  });
});


describe('GET /:user/:repo/builds/', () => {
  it('returns build', done => {
    createBuilds([buildFactory()]).then(() => {
      request(app.app)
        .get(prefix('/sherlocked/adlerjs/builds/'))
        .end((err, res) => {
          assert.equal(res.body[0].travisId, 221);
          done();
        });
    });
  });

  it('404s', done => {
    createBuilds([buildFactory()]).then(() => {
      request(app.app)
        .get(prefix('/ngokevin/ngokevin/builds/'))
        .end((err, res) => {
          assert.equal(res.statusCode, 404);
          done();
        });
    });
  });
});


describe('POST /builds/', () => {
  it('creates a build', done => {
    request(app.app)
      .post(prefix('/builds/'))
      .send(buildFactory())
      .expect(201, () => {
        getBuild(build => {
          assert.equal(build.travisId, 221);
          done();
        });
      });
  });

  it('attaches latest master build', done => {
    // Create some master builds.
    var masterBuildCreated = new Promise(resolve => {
      createBuilds([
        buildFactory({travisBranch: 'master', travisId: 1}),
        buildFactory({travisBranch: 'master', travisId: 2}),
        buildFactory({travisBranch: 'master', travisId: 3}),
      ]).then(() => {
        var masterBuild = buildFactory({travisBranch: 'master',
                        travisId: 4});
        setTimeout(() => {
          createBuilds([masterBuild]).then(() => {
            resolve(masterBuild);
          });
        }, 10);
      });
    });

    masterBuildCreated.then(masterBuild => {
      request(app.app)
        .post(prefix('/builds/'))
        .send(buildFactory({travisId: 222}))
        .expect(201, () => {
          getBuild(build => {
            assert.equal(build.masterBuild.travisId,
                   masterBuild.travisId);
            done();
          }, 222);
        });
    });
  });

  it('does not create dupe builds', done => {
    request(app.app)
      .post(prefix('/builds/'))
      .send(buildFactory())
      .expect(201, () => {
        request(app.app)
          .post(prefix('/builds/'))
          .send(buildFactory())
          .expect(409, done);
      });
  });
});


describe('GET /builds/:buildId', () => {
  it('returns a build', done => {
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

    createBuilds([buildFactory()]).then(() => {
      request(app.app)
        .get(prefix('/builds/221'))
        .end((err, res) => {
          assertBuild(res.body);
        });
    });
  });

  it('returns a build with captures', done => {
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
             '/api/captures/221B');
      assert.equal(Object.keys(build.captures[0].masterCaptures).length,
             0);
      done();
    }

    createBuilds([buildFactory()]).then(() => {
      request(app.app)
        .post(prefix('/builds/221/captures/'))
        .send(captureFactory())
        .end((err, res) => {
          request(app.app)
            .get(prefix('/builds/221'))
            .end((err, res) => {
              assertBuild(res.body);
            });
        });
    });
  });

  it('returns a build w/ master build captures w/ same env', done => {
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
    createBuilds([masterBuild]).then(() => {
    createBuilds([buildFactory()]).then(() => {
      request(app.app)
        .post(prefix('/builds/123/captures/'))
        .send(captureFactory())
        .end((err, res) => {
          request(app.app)
            .post(prefix('/builds/221/captures/'))
            .send(captureFactory({sauceSessionId: 'abc'}))
            .end((err, res) => {
              request(app.app)
                .get(prefix('/builds/221'))
                .end((err, res) => {
                  assertBuild(res.body);
                });
            });
        });
    });
    });
  });
});


describe('POST /builds/:buildId/done', () => {
  it('is successful', done => {
    if (!config.githubToken) {
      done();
      return;
    }

    var build = buildFactory({
      travisRepoSlug: 'ngokevin/sherlocked',
      travisPullRequest: '1',
    });
    createBuilds([build]).then(() => {
      request(app.app)
        .post(prefix('/builds/221/done'))
        .expect(201, done);
    });
  });
});


describe('POST /builds/:id/captures/', () => {
  it('creates capture on build', done => {
    createBuilds([buildFactory()]).then(() => {
      request(app.app)
        .post(prefix('/builds/221/captures/'))
        .send(captureFactory())
        .expect(201, () => {
          getBuild(build => {
            assert.equal(build.captures.length, 1);
            var captureGroup = build.captures[0];
            assert.equal(Object.keys(captureGroup.captures).length,
                   1);
            done();
          });
        });
    });
  });

  it('creates multiple captures with same browserEnv', done => {
    function assertBuild(build) {
      assert.equal(build.captures.length, 1);
      var captureGroup = build.captures[0];
      assert.equal(Object.keys(captureGroup.captures).length, 2);
      done();
    }

    createBuilds([buildFactory()]).then(() => {
      request(app.app)
        .post(prefix('/builds/221/captures/'))
        .send(captureFactory({browserVersion: undefined}))
        .end((err, res) => {
          request(app.app)
            .post(prefix('/builds/221/captures/'))
            .send(captureFactory({browserVersion: undefined,
                        name: 'watsonsFace',
                        sauceSessionId: '221C'}))
            .end((err, res) => {
              getBuild(assertBuild);
            });
        });
    });
  });

  it('creates multiple captures with different browserEnv', done => {
    function assertBuild(build) {
      assert.equal(build.captures.length, 2);
      var firefoxGroup = build.captures[0];
      assert.equal(Object.keys(firefoxGroup.captures).length, 1);
      var chromeGroup = build.captures[1];
      assert.equal(Object.keys(chromeGroup.captures).length, 1);
      done();
    }

    createBuilds([buildFactory()]).then(() => {
      request(app.app)
        .post(prefix('/builds/221/captures/'))
        .send(captureFactory())
        .end((err, res) => {
          request(app.app)
            .post(prefix('/builds/221/captures/'))
            .send(captureFactory({
              browserName: 'chrome',
              name: 'watsonsFace',
              sauceSessionId: '221C'
            }))
            .end((err, res) => {
              getBuild(assertBuild);
            });
        });
    });
  });

  it('creates captureDiff with master build capture', done => {
    function assertBuild(build) {
      done();
    }

    var masterBuild = buildFactory({travisBranch: 'master',
                    travisId: 123});
    // Create builds.
    createBuilds([masterBuild]).then(() => {
    createBuilds([buildFactory()]).then(() => {
      // Send capture to master build.
      request(app.app)
        .post(prefix('/builds/123/captures/'))
        .send(captureFactory({name: 'testcapture'}))
        .end((err, res) => {
          // Send capture to modified build.
          request(app.app)
            .post(prefix('/builds/221/captures/'))
            .send(captureFactory({sauceSessionId: 'abc', name: 'testcapture'}))
            .end((err, res) => {
              // Assert that we have a diff.
              request(app.app)
                .get(prefix('/builds/221'))
                .end((err, res) => {
                  assertBuild(res.body);
                });
            });
        });
    });
    });
  });
});



describe('GET /captures/:sauceSessionId', done => {
  it('gets a capture', done => {
    request(app.app)
      .get(prefix('/captures/test'))
      .expect(200)
      .expect('Content-Type', 'image/png', done);
  });

  it('404s if capture does not exist', done => {
    request(app.app)
      .get(prefix('/captures/doesnotexist'))
      .expect(404, done);
  });
});


function getBuild(cb, id) {
  request(app.app).get(prefix('/builds/') + (id || 221))
    .end((err, res) => {
      cb(res.body);
    });
}


function createBuilds(builds) {
  // Create Builds via POST requests to the API.
  return Promise.all(builds.map(build => {
    return new Promise(resolve => {
      request(app.app)
        .post(prefix('/builds/'))
        .send(build)
        .end((err, res) => {
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
    image: fs.readFileSync('tests/capture.png', {encoding: 'base64'}),
    name: 'watsonsButt',
    sauceSessionId: '221B',
  }, extendObj);
}
