var assert = require('assert');
var fs = require('fs');
var orm = require('orm');
var request = require('supertest');

var app = require('./app');


afterEach(function(done) {
    // Teardown and rebuild database.
    fs.unlink(process.env.SHERLOCKED_TEST_DB.split('/')[2]);
    app.dbSetup(done);
});


describe('GET /', function() {
    it('is OK', function(done) {
        request(app.app)
            .get('/')
            .expect(200, done);
    });
});


describe('GET /builds', function() {
    it('returns 0 builds', function(done) {
        request(app.app).get('/builds')
        .end(function(err, res) {
            assert.equal(res.body.length, 0);
            done();
        });
    });

    it('returns 1 build', function(done) {
        createBuild([{sauceSessionId: '221B'}], function() {
            request(app.app).get('/builds')
                .end(function(err, res) {
                    assert.equal(res.body[0].sauceSessionId, '221B');
                    done();
                });
        });
    });

    it('returns 2 builds', function(done) {
        createBuild([{sauceSessionId: '221B'},
                     {sauceSessionId: 'N239'}], function() {
            request(app.app).get('/builds')
                .end(function(err, res) {
                    assert.equal(res.body[0].sauceSessionId, '221B');
                    assert.equal(res.body[1].sauceSessionId, 'N239');
                    done();
                });
        });
    });
});


describe('POST /builds', function() {
    it('creates a builds', function(done) {
        request(app.app).post('/builds')
            .send({sauceSessionId: '221B'})
            .end(function(err, res) {
                assert.equal(res.body.sauceSessionId, '221B');
            });

        request(app.app).get('/builds')
            .end(function(err, res) {
                assert.equal(res.body[0].sauceSessionId, '221B');
                done();
            });
    });
});


function createBuild(builds, cb) {
    orm.connect(process.env.SHERLOCKED_TEST_DB, function(e, db) {
        var Build = db.define.apply(db, app.models.Build);
        Build.create(builds, cb);
    });
}
