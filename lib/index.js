var fs = require('fs');
var path = require('path');
var url = require('url');

var request = require('superagent');
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


function getScreenshotSrc(sauceSessionId) {
    // Get screenshot URL for Sauce Labs.
    var sauceLabsUrl = 'https://saucelabs.com/rest/v1/';
    sauceLabsUrl = url.resolve(sauceLabsUrl, process.env.SAUCE_USERNAME + '/');
    sauceLabsUrl = url.resolve(sauceLabsUrl, 'jobs/');
    sauceLabsUrl = url.resolve(sauceLabsUrl, sauceSessionId + '/');
    sauceLabsUrl = url.resolve(sauceLabsUrl, 'assets/final_screenshot.png');
    return sauceLabsUrl;
}


function uploadCapture(browserEnv, captureName, sauceSessionId) {
    // Attach a Capture to the Sherlocked Build.
    // The ID of the Build is the Travis build ID.
    var captureUrl = url.resolve(API_ROOT, 'builds/');
    captureUrl = url.resolve(captureUrl,
                             process.env.TRAVIS_BUILD_ID.toString() +'/');
    captureUrl = url.resolve(captureUrl, 'captures/');

    var src = getScreenshotSrc(sauceSessionId);
    console.log('Submitting evidence to Sherlocked at ' + captureUrl);
    console.log('    ' + src);
    var data = {
        browserName: browserEnv.browserName,
        browserPlatform: browserEnv.platform,
        browserVersion: browserEnv.version,
        name: captureName,
        sauceSessionId: sauceSessionId,
        src: src
    };
    request.post(captureUrl)
           .send(data)
           .set('Accept', 'application/json')
           .end(function() {});
}


function slugifyBrowserEnv(browserEnv) {
    return browserEnv.browser + '-' +
           (browserEnv.version || 'latest') + '-' +
           browserEnv.platform.replace(/ /, '_');
}


function run(testConfig) {
    // Create a Sherlocked Build.
    var buildUrl = url.resolve(API_ROOT, 'builds/');
    var data = {
        travisBranch: process.env.TRAVIS_BRANCH,
        travisCommit: process.env.TRAVIS_COMMIT,
        travisId: process.env.TRAVIS_BUILD_ID,
        travisPullRequest: process.env.TRAVIS_PULL_REQUEST,
        travisRepoSlug: process.env.TRAVIS_REPO_SLUG
    };
    request.post(buildUrl)
           .send(data)
           .set('Accept', 'application/json')
           .end(function() {});
    console.log('Sherlocked: The Adventure of the ' + verb + ' ' + buildUrl +
                process.env.TRAVIS_BUILD_ID);

    testConfig.environments.forEach(function(browserEnv, i) {
        // Initialize client.
        // Use ondemand.saucelabs.com:80 if no firewall.
        // Use localhost:4445 for Sauce Connect.
        function generateClient() {
            return webdriver.remote({
                desiredCapabilities: browserEnv,
                host: 'localhost',
                key: process.env.SAUCE_ACCESS_KEY,
                port: 4445,
                user: process.env.SAUCE_USERNAME
            })
            .init()
            .timeoutsImplicitWait(process.env.SHERLOCKED_WAIT || 5000);
        }

        // Take captures.
        Object.keys(testConfig.captures).forEach(function(captureName) {
            var sauceSessionId;
            testConfig.captures[captureName](generateClient())
                .session(function(err, res) {
                    sauceSessionId = res.sessionId;
                })
                .end(function() {
                    uploadCapture(browserEnv, captureName, sauceSessionId);
                });
        });
    });
}

module.exports = {
    run: run
};
