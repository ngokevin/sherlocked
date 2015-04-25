var fs = require('fs');
var path = require('path');

var request = require('request');
var webdriver = require('webdriverio');


function pingService(sessionId) {
    // Uploads build information to the service.
    var url = process.env.SHERLOCKED_API || 'http://localhost:1077/build/';
    var data = {
        sauceSessionId: sessionId,
        travisBranch: process.env.TRAVIS_BRANCH,
        travisCommit: process.env.TRAVIS_COMMIT,
        travisId: process.env.TRAVIS_BUILD_ID,
        travisRepoSlug: process.env.TRAVIS_REPO_SLUG
    };
    request.post(url, {json: true, body: data});
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
