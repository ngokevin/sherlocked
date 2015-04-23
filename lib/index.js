var fs = require('fs');
var path = require('path');

var webdriver = require('webdriverio');


function pingService(sessionId) {
    // Uploads build information to the service.
    console.log({
        sessionId: sessionId,
        travisBranch: process.env.TRAVIS_BRANCH,
        travisId: process.env.TRAVIS_BUILD_ID,
        travisCommit: process.env.TRAVIS_COMMIT,
    });
}


function run(testConfig) {
    testConfig.environments.forEach(function(env, i) {
        // Initialize client.
        // Use ondemand.saucelabs.com:80 if no firewall.
        // Use localhost:4445 for Sauce Connect.
        function generateClient() {
            return webdriver.remote({
                desiredCapabilities: env,
                host: process.env.SAUCE_HOST || 'localhost',
                key: process.env.SAUCE_KEY || testConfig.SAUCE_KEY,
                logLevel: 'verbose',
                port: process.env.SAUCE_PORT || 4445,
                user: process.env.SAUCE_USERNAME || testConfig.SAUCE_USERNAME,
            });
        }

        // Take captures.
        testConfig.captures.forEach(function(captureFn) {
            var sessionId;
            captureFn(generateClient())
                .saveScreenshot('.tmp.png')
                .session(function(err, res) {
                    sessionId = res.sessionId;
                })
                .end(function() {
                    pingService(sessionId);
                });
        });
    });
}

module.exports = {
    run: run
};
