import fs from 'fs';

import assert from 'assert';
import extend from 'extend';
import knex from 'knex';
import migrate from 'migrate';
import supertest from 'supertest-as-promised';

import app from '../index';
import config from '../config';


const req = supertest(Promise).agent(app.app);
const db = knex(config);


function prefix(url) {
  return '/api' + url;
}


beforeEach(async function(done) {
  // Teardown and rebuild database.
  this.timeout(10000);

  await Promise.all([
    db('build').truncate(),
    db('browserEnv').truncate(),
    db('capture').truncate(),
    db('captureDiff').truncate()
  ]);

  done();
});


describe('GET /', () => {
  it('is OK', async function(done) {
    let res = await req
      .get(prefix('/'))
      .expect(200);
    done();
  });
});


describe('GET /builds/', () => {
  it('returns 0 builds', async function(done) {
    await req
      .get(prefix('/builds/'))
      .expect(404);
    done();
  });

  it('returns 1 build', async function(done) {
    await createBuilds([buildFactory()]);

    const res = await req.get(prefix('/builds/'))
    assert.equal(res.body[0].travisId, 221);
    done();
  });

  it('returns 2 builds', async function(done) {
    await createBuilds([buildFactory(), buildFactory({travisId: 239})]);

    // Order by created_by DESC.
    const res = await req.get(prefix('/builds/'));
    assert.equal(res.body.length, 2);
    done();
  });
});


describe('GET /:user/:repo/builds/', () => {
  it('returns build', async function(done) {
    await createBuilds([buildFactory()]);
    const res = await req.get(prefix('/sherlocked/adlerjs/builds/'))
    assert.equal(res.body[0].travisId, 221);
    done();
  });

  it('404s', async function(done) {
    await createBuilds([buildFactory()]);
    await req
      .get(prefix('/ngokevin/ngokevin/builds/'))
      .expect(404);
    done();
  });
});


describe('POST /builds/', () => {
  it('creates a build', async function(done) {
    // Create build.
    await req
      .post(prefix('/builds/'))
      .send(buildFactory())
      .expect(201);

    // Verify through GET.
    const build = await getBuild();
    assert.equal(build.travisId, 221);
    done();
  });

  it('attaches latest master build', async function(done) {
    // Create some master builds.
    await createBuilds([
      buildFactory({travisBranch: 'master', travisId: 1}),
      buildFactory({travisBranch: 'master', travisId: 2}),
      buildFactory({travisBranch: 'master', travisId: 3}),
    ]);

    const masterBuild = buildFactory({travisBranch: 'master', travisId: 4});
    await createBuilds([masterBuild]);

    const res = await req
      .post(prefix('/builds/'))
      .send(buildFactory({travisId: 222}))
      .expect(201);

    const build = await getBuild(222);
    assert.equal(build.masterBuild.travisId, masterBuild.travisId);
    done();
  });

  it('does not create dupe builds', async function(done) {
    await req
      .post(prefix('/builds/'))
      .send(buildFactory())
      .expect(201);
    await req
      .post(prefix('/builds/'))
      .send(buildFactory())
      .expect(409);
    done();
  });
});


describe('GET /builds/:buildId', () => {
  it('returns a build', async function(done) {
    await createBuilds([buildFactory()]);
    const res = await req.get(prefix('/builds/221'));
    const build = res.body;

    assert.equal(build.travisId, 221);
    assert.equal(build.travisBranch, 'updateHatStyle');
    assert.equal(build.travisCommit, '01189998819991197253');
    assert.equal(build.travisPullRequest, 221);
    assert.equal(build.travisRepoSlug, 'sherlocked/adlerjs');

    assert.equal(build.captures.length, 0);
    assert.equal(build.masterBuild, undefined);
    done();
  });

  it('returns a build with captures', async function(done) {
    await createBuilds([buildFactory()]);
    await req
      .post(prefix('/builds/221/captures/'))
      .send(captureFactory());

    const res = await req.get(prefix('/builds/221'));
    const build = res.body;
    const capture = build.captures[0];

    assert.equal(build.captures.length, 1);
    assert.equal(capture.browserEnv.name, 'firefox');
    assert.equal(capture.browserEnv.platform, 'OS X 10.9');
    assert.equal(capture.browserEnv.version, '40');
    assert.equal(capture.captures.watsonsButt.name, 'watsonsButt');
    assert.equal(capture.captures.watsonsButt.sauceSessionId, '221B');
    assert.equal(capture.captures.watsonsButt.src, '/api/captures/221B');
    assert.equal(Object.keys(capture.masterCaptures).length, 0);
    done();
  });

  it('returns build w/ master build w/ same env', async function(done) {
    const masterBuild = buildFactory({travisBranch: 'master', travisId: 123});
    await createBuilds([masterBuild]);
    await createBuilds([buildFactory()]);

    // Upload two captures.
    await req
      .post(prefix('/builds/123/captures/'))
      .send(captureFactory());
    await req
      .post(prefix('/builds/221/captures/'))
      .send(captureFactory({sauceSessionId: 'abc'}));

    const res = await req.get(prefix('/builds/221'));
    const build = res.body;
    const captureGroup = build.captures[0];
    const captures = captureGroup.captures;
    const masterCaptures = captureGroup.masterCaptures;

    assert.equal(captureGroup.browserEnv.name, 'firefox');
    assert.equal(captureGroup.browserEnv.version, '40');
    assert.equal(captureGroup.browserEnv.platform, 'OS X 10.9');
    assert.equal(Object.keys(captures).length, 1);
    assert.equal(Object.keys(masterCaptures).length, 1);
    assert.equal(captures.watsonsButt.sauceSessionId, 'abc');
    assert.equal(masterCaptures.watsonsButt.sauceSessionId, '221B');

    done();
  });
});


describe('POST /builds/:buildId/done', () => {
  it('is successful', async function(done) {
    if (!config.githubToken) {
      return done();
    }

    await createBuilds([buildFactory({
      travisRepoSlug: 'ngokevin/sherlocked',
      travisPullRequest: '1',
    })]);

    await req
      .post(prefix('/builds/221/done'))
      .expect(201);
    done();
  });
});


describe('POST /builds/:id/captures/', () => {
  it('creates capture on build', async function(done) {
    await createBuilds([buildFactory()]);
    await req
      .post(prefix('/builds/221/captures/'))
      .send(captureFactory())
      .expect(201);

    const build = await getBuild();
    assert.equal(build.captures.length, 1);
    assert.equal(Object.keys(build.captures[0].captures).length, 1);
    done();
  });

  it('creates multiple captures with same browserEnv', async function(done) {
    await createBuilds([buildFactory()]);
    await req
      .post(prefix('/builds/221/captures/'))
      .send(captureFactory({browserVersion: undefined}));

    await req
      .post(prefix('/builds/221/captures/'))
      .send(captureFactory({browserVersion: undefined,
                            name: 'watsonsFace',
                            sauceSessionId: '221C'}));

    const build = await getBuild();
    assert.equal(build.captures.length, 1);
    assert.equal(Object.keys(build.captures[0].captures).length, 2);
    done();
  });

  it('creates multiple captures w/ diff browserEnv', async function(done) {
    await createBuilds([buildFactory()]);

    await req
      .post(prefix('/builds/221/captures/'))
      .send(captureFactory());
    await req
      .post(prefix('/builds/221/captures/'))
      .send(captureFactory({
        browserName: 'chrome',
        name: 'watsonsFace',
        sauceSessionId: '221C'
      }));

    const build = await getBuild();
    assert.equal(build.captures.length, 2);
    const firefoxGroup = build.captures[0];
    assert.equal(Object.keys(firefoxGroup.captures).length, 1);
    const chromeGroup = build.captures[1];
    assert.equal(Object.keys(chromeGroup.captures).length, 1);
    done();
  });

  it('creates captureDiff with master build capture', async function(done) {
    const masterBuild = buildFactory({travisBranch: 'master', travisId: 123});

    // Create builds.
    await createBuilds([masterBuild]);
    await createBuilds([buildFactory()]);

    // Send capture to master build.
    await req
      .post(prefix('/builds/123/captures/'))
      .send(captureFactory({name: 'testcapture'}));

    // Send capture to modified build.
    await req
      .post(prefix('/builds/221/captures/'))
      .send(captureFactory({sauceSessionId: 'abc', name: 'testcapture'}));

    const build = await getBuild();
    const diff = build.captures[0].captures.testcapture.diff;
    try {
      assert.equal(diff.captureId, build.captures[0].captures.testcapture.id);
      assert.equal(diff.dimensionDifferenceHeight, 0);
      assert.equal(diff.dimensionDifferenceWidth, 0);
      assert.equal(diff.mismatchPercentage, null);
      assert.equal(diff.isSameDimensions, 1);
      assert.equal(diff.src, prefix('/captures/diff/abc'));
      done();
    } catch (e) {
      done(e);
    }
  });
});


describe('GET /captures/:sauceSessionId', async function(done) {
  it('gets a capture', async function(done) {
    await req
      .get(prefix('/captures/test'))
      .expect(200)
      .expect('Content-Type', 'image/png');
    done();
  });

  it('404s if capture does not exist', async function(done) {
    await req
      .get(prefix('/captures/doesnotexist'))
      .expect(404);
    done()
  });
});


describe('GET /captures/:sauceSessionId', async function(done) {
  it('gets a capture diff', async function(done) {
    await req
      .get(prefix('/captures/diff/test'))
      .expect(200)
      .expect('Content-Type', 'image/png');
    done();
  });

  it('404s if capture diff does not exist', async function(done) {
    await req
      .get(prefix('/captures/diff/doesnotexist'))
      .expect(404);
    done();
  });
});



function getBuild(id) {
  return new Promise(async function(resolve) {
    let res = await req.get(prefix('/builds/') + (id || 221))
    resolve(res.body);
  });
}


function createBuilds(builds) {
  // Create Builds via POST requests to the API.
  return Promise.all(builds.map(build => {
    return new Promise(async function(resolve) {
      let res = await req
        .post(prefix('/builds/'))
        .send(build);
      resolve(res.body);
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
