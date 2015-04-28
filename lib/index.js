var fs = require('fs');
var path = require('path');
var url = require('url');

var request = require('request');
var webdriver = require('webdriverio');


var API_ROOT = process.env.SHERLOCKED_API || 'http://localhost:1077/';


var verbs = [
    'Scarlet', 'Red-Headed', 'Five Orange', 'Twisted', 'Blue', 'Speckled',
    'Engineer\'s', 'Noble', 'Beryl', 'Copper', 'Silver', 'Cardboard', 'Yellow',
    'Stockbroker\'s', 'Musgrave', 'Reigate', 'Crooked', 'Resident', 'Greek',
    'Naval', 'Final', 'Empty', 'Norwood', 'Dancing', 'Solitary', 'Priory',
    'Black', 'Six', 'Three', 'Golden', 'Missing', 'Abbey', 'Second',
    'Wisteria', 'Red', 'Dying', 'Devil\'s', 'Mazarin', 'Thor', 'Creeping',
    'Sussex', 'Illustrious', 'Blanched', 'Lion\'s', 'Retired', 'Veiled', 'Old'
];
var verb = verbs[Math.floor(Math.random() * verbs.length)];


function uploadCapture(captureName, sauceSessionId) {
    // Attach a Capture to the Sherlocked Build.
    // The ID of the Build is the Travis build ID.
    var captureUrl = url.resolve(API_ROOT, 'builds/');
    captureUrl = url.resolve(captureUrl, process.env.TRAVIS_BUILD_ID);
    captureUrl = url.resolve(captureUrl, 'captures/');

    console.log('Handing evidence to Sherlocked at ' + captureUrl);
    var data = {
        name: captureName,
        sauceSessionId: sauceSessionId,
    };
    request.post(captureUrl, {json: true, body: data});
}


function run(testConfig) {
    // Create a Sherlocked Build.
    var buildUrl = url.resolve(API_ROOT, 'builds/');
    var data = {
        travisId: process.env.TRAVIS_BUILD_ID,
        travisPullRequest: process.env.TRAVIS_PULL_REQUEST,
        travisRepoSlug: process.env.TRAVIS_REPO_SLUG
    };
    request.post(buildUrl, {json: true, body: data});
    console.log('Sherlocked: The Adventure of the ' + verb + ' ' + buildUrl +
                process.env.TRAVIS_BUILD_ID);

    testConfig.environments.forEach(function(env, i) {
        // Initialize client.
        // Use ondemand.saucelabs.com:80 if no firewall.
        // Use localhost:4445 for Sauce Connect.
        function generateClient() {
            return webdriver.remote({
                desiredCapabilities: env,
                host: process.env.SAUCE_HOST || 'localhost',
                key: process.env.SAUCE_KEY || testConfig.SAUCE_KEY,
                logLevel: 'data',
                port: process.env.SAUCE_PORT || 4445,
                user: process.env.SAUCE_USERNAME || testConfig.SAUCE_USERNAME,
            });
        }

        // Take captures.
        Object.keys(testConfig.captures).forEach(function(captureName) {
            var sauceSessionId;
            testConfig.captures[captureName](generateClient())
                .session(function(err, res) {
                    sauceSessionId = res.sessionId;
                })
                .end(function() {
                    uploadCapture(captureName, sauceSessionId);
                });
        });
    });
}

module.exports = {
    run: run
};
