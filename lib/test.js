var assert = require('assert');
var superagent = require('superagent-mock');

var sherlocked = require('./index');


function getEnvironments() {
    return [{
        browserName: 'firefox',
        platform: 'OS X 10.9'
    }];
}


function captureFactory() {
    return function(client) {
        return client;
    };
}


describe('create build', function() {
    var createBuild = sherlocked.createBuild;

    it('returns data', function(done) {
        createBuild().then(function(data) {
            assert.equal(data.travisBranch, 'updateHat');
            assert.equal(data.travisCommit, '211B');
            assert.equal(data.travisId, '1234');
            assert.equal(data.travisPullRequest, '1001');
            assert.equal(data.travisRepoSlug, 'ngokevin/sherlocked');
            done();
        });
    });
});


describe('generateClient', function() {
    var generateClient = sherlocked.generateClient;

    it('generates a client', function() {
        var multiConfig = sherlocked.getSauceConfig(getEnvironments());
        var client = generateClient(multiConfig);
        assert.ok(client);
    });
});


describe('getSauceConfig', function() {
    var getSauceConfig = sherlocked.getSauceConfig;

    it('builds a multi-browser config', function() {
        var environments = getEnvironments();
        environments.push({browserName: 'chrome'});
        var multiConfig = getSauceConfig(environments);

        assert.equal(multiConfig.browser0.desiredCapabilities.browserName,
                     environments[0].browserName);
        assert.equal(multiConfig.browser1.desiredCapabilities.browserName,
                     'chrome');
    });

    it('attaches Sauce credentials', function() {
        var multiConfig = getSauceConfig(getEnvironments());

        assert.equal(multiConfig.browser0.key, 'my-sauce-key');
        assert.equal(multiConfig.browser0.user, 'my-sauce-username');
    });

    it('attaches tunnel identifier', function() {
        var multiConfig = getSauceConfig(getEnvironments());

        assert.equal(multiConfig.browser0.desiredCapabilities.tunnelIdentifier,
                     '211');
    });
});


describe('investigate', function() {
    var investigate = sherlocked.investigate;

    afterEach(function() {
        sherlocked.setCaptures([]);
    });

    it('adds capture', function() {
        assert.ok(!investigate('Test Capture', function() {}).error);
        assert.equal(sherlocked.getCaptures().length, 1);
    });

    it('does not add capture without name', function() {
        assert.ok(investigate('', function() {}).error);
        assert.equal(sherlocked.getCaptures().length, 0);
    });

    it('does not add capture with no captureFn', function() {
        assert.ok(investigate('Test Capture').error);
        assert.equal(sherlocked.getCaptures().length, 0);
    });

    it('does not validate with capture with non-string name', function() {
        assert.ok(investigate(5, function() {}).error);
    });

    it('does not validate with capture with non-function capture', function() {
        assert.ok(investigate('Test Capture', {}).error);
    });

    it('chains', function() {
        assert.ok(
            investigate('Test Capture', function() {})
            .investigate('Test Capture 2', function() {}));
        assert.equal(sherlocked.getCaptures().length, 2);
    });
});


describe('start', function() {
    it('runs', function() {
        sherlocked.investigate('Test Capture', function() {});
        assert.ok(sherlocked.start(getEnvironments()));
    });
});


describe('uploadCapture', function() {
    var uploadCapture = sherlocked.uploadCapture;

    it('returns data', function(done) {
        sherlocked
            .uploadCapture('img-png/x', getEnvironments()[0], 'Home Page', 'z')
            .then(function(data) {
                assert.equal(data.browserName, 'firefox');
                assert.equal(data.browserPlatform, 'OS X 10.9');
                assert.equal(data.browserVersion, undefined);
                assert.equal(data.image, 'img-png/x');
                assert.equal(data.name, 'Home Page');
                assert.equal(data.sauceSessionId, 'z');
                done();
            });
    });
});


describe('validateCaptures', function() {
    var validateCaptures = sherlocked.validateCaptures;

    it('validates', function() {
        assert.ok(validateCaptures([captureFactory()]));
    });

    it('does not validate without captures', function() {
        assert.ok(!validateCaptures());
    });

    it('does not validate with empty captures', function() {
        assert.ok(!validateCaptures([]));
    });

    it('does not validate with non-array captures', function() {
        assert.ok(!validateCaptures({}));
    });

    it('does not validate with duplicate capture names', function() {
        assert.ok(!validateCaptures([captureFactory(), captureFactory()]));
    });
});


describe('validateEnvironments', function() {
    var validateEnvironments = sherlocked.validateEnvironments;

    it('validates', function() {
        assert.ok(validateEnvironments(getEnvironments()));
    });

    it('does not validate without environments', function() {
        assert.ok(!validateEnvironments());
    });

    it('does not validate with non-array environment', function() {
        assert.ok(!validateEnvironments({}));
    });
});
