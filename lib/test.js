var assert = require('assert');

var sherlocked = require('./index');


function getTestConfig() {
    return {
        environments: [{
            browserName: 'firefox',
            platform: 'OS X 10.9'
        }],
        captures: [{
            name: 'Home Page',
            capture: function(client) {
                return client;
            }
        }]
    };
}


describe('validateConfig', function() {
    var validateConfig = sherlocked.validateConfig;

    it('validates', function() {
        assert.ok(validateConfig(getTestConfig()));
    });

    it('does not validate without environments', function() {
        var testConfig = getTestConfig();
        delete testConfig.environments;
        assert.ok(!validateConfig(testConfig));
    });

    it('does not validate with non-array environment', function() {
        var testConfig = getTestConfig();
        testConfig.environments = {};
        assert.ok(!validateConfig(testConfig));
    });

    it('does not validate without captures', function() {
        var testConfig = getTestConfig();
        delete testConfig.captures;
        assert.ok(!validateConfig(testConfig));
    });

    it('does not validate with non-array captures', function() {
        var testConfig = getTestConfig();
        testConfig.captures = {};
        assert.ok(!validateConfig(testConfig));
    });

    it('does not validate with bad capture', function() {
        var testConfig = getTestConfig();
        delete testConfig.captures[0].name;
        assert.ok(!validateConfig(testConfig));
    });

    it('does not validate with capture with no name', function() {
        var testConfig = getTestConfig();
        delete testConfig.captures[0].name;
        assert.ok(!validateConfig(testConfig));
    });

    it('does not validate with capture with no capture', function() {
        var testConfig = getTestConfig();
        delete testConfig.captures[0].capture;
        assert.ok(!validateConfig(testConfig));
    });

    it('does not validate with capture with non-string name', function() {
        var testConfig = getTestConfig();
        testConfig.captures[0].name = 5;
        assert.ok(!validateConfig(testConfig));
    });

    it('does not validate with capture with non-function capture', function() {
        var testConfig = getTestConfig();
        testConfig.captures[0].capture = {};
        assert.ok(!validateConfig(testConfig));
    });

    it('does not validate with duplicate capture names', function() {
        var testConfig = getTestConfig();
        testConfig.captures.push({
            name: 'Home Page',
            capture: function() {},
        });
        assert.ok(!validateConfig(testConfig));
    });
});


describe('getSauceConfig', function() {
    var getSauceConfig = sherlocked.getSauceConfig;

    it('builds a multi-browser config', function() {
        var testConfig = getTestConfig();
        testConfig.environments.push({browserName: 'chrome'});
        var multiConfig = getSauceConfig(testConfig);

        assert.equal(multiConfig.browser0.desiredCapabilities.browserName,
                     testConfig.environments[0].browserName);
        assert.equal(multiConfig.browser1.desiredCapabilities.browserName,
                     'chrome');
    });

    it('attaches Sauce credentials', function() {
        var testConfig = getTestConfig();
        testConfig.sauceAccessKey = 'my-sauce-key';
        testConfig.sauceUsername = 'my-sauce-username';
        var multiConfig = getSauceConfig(testConfig);

        assert.equal(multiConfig.browser0.key, 'my-sauce-key');
        assert.equal(multiConfig.browser0.user, 'my-sauce-username');
    });

    it('attaches tunnel identifier', function() {
        var testConfig = getTestConfig();
        testConfig.travisJobNumber = '555';
        var multiConfig = getSauceConfig(testConfig);

        assert.equal(multiConfig.browser0.desiredCapabilities.tunnelIdentifier,
                     '555');
    });
});


describe('generateClient', function() {
    var generateClient = sherlocked.generateClient;

    it('generates a client', function() {
        var testConfig = getTestConfig();
        var multiConfig = sherlocked.getSauceConfig(testConfig);
        var client = generateClient(multiConfig);
        assert.ok(client);
    });
});


describe('run', function() {
    var run = sherlocked.run;

    it('needs access key and username', function() {
        assert.ok(!run());
    });
});
