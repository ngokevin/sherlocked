/*
    Module that creates captures from Sauce Labs from a Sherlocked test script.
    Uses webdriverio's multiremote (not yet in stable).
*/
var fs = require('fs');
var path = require('path');
var url = require('url');

var Promise = require('es6-promise').Promise;
var PromiseSeries = require('promise-series');
var request = require('superagent');
var webdriver = require('webdriverio-master');
var _ = require('underscore');


// Or http://localhost:1077/api/ for development.
var API_ROOT = process.env.SHERLOCKED_API ||
               'http://sherlocked.dev.mozaws.net/api/';


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


function validateConfig(testConfig) {
    var error = false;

    function err(msg) {
        console.error(msg);
        error = true;
    }

    // Check environments.
    if (!testConfig.environments ||
        testConfig.environments.constructor !== Array) {
        err('`environments` not found or not an array. Enlighten ' +
            'the case by providing a list of browser environments ' +
            'in the form of Selenium desiredCapabilities.');
    }

    // Check captures.
    if (!testConfig.captures || testConfig.captures.constructor !== Array) {
        err('`captures` not found or not an array. Provide a list ' +
            'of objects that contain a key called `capture` which ' +
            'are functions that operate on a WebdriverIO client.');
    } else {
        testConfig.captures.forEach(function(capture) {
            if (!capture.name || !capture.capture) {
                err('A capture was found without a `name` ' +
                    '(string) or `capture` (function).');
            }
            if (capture.name && capture.name.constructor !== String) {
                err('`capture` must be a string.');
            }
            if (capture.capture && capture.capture.constructor !== Function) {
                err('`capture` must be a function.');
            }
        });

        // Check for duplicate capture names.
        var numUniqueNames = _.uniq(testConfig.captures.map(function(cObj) {
            return cObj.name;
        })).length;
        if (numUniqueNames !== testConfig.captures.length) {
            err('Redundant evidence found in the case. Examine ' +
                'that all capture names are unique.');
        }
    }

    testConfig.sauceUsername = process.env.SAUCE_USERNAME;
    testConfig.sauceAccessKey = process.env.SAUCE_ACCESS_KEY;
    testConfig.travisJobNumber = process.env.TRAVIS_JOB_NUMBER;
    return !error;
}


function createSherlockedBuild() {
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
        .end(function(err) {
            if (err && [403, 500].indexOf(err.statusCode) !== -1) {
                console.log('\nWhere is Sherlock when you need him?');
                console.log('    Error: ' + API_ROOT + ' could not be found.');
                process.exit(1);
            }
        });
    console.log('\nThe Adventure of the ' + verb + ' Build: ' +
                buildUrl + process.env.TRAVIS_BUILD_ID + '\n');
}


function getSauceConfig(testConfig) {
    // Set up client config.
    var multiremote = {};
    testConfig.environments.forEach(function(browserEnv, i) {
        // Use ondemand.saucelabs.com:80 if no firewall.
        // Use localhost:4445 for Sauce Connect.
        var jobNum = testConfig.travisJobNumber ||
                     process.env.TRAVIS_JOB_NUMBER;
        browserEnv['tunnel-identifier'] = jobNum;
        browserEnv.tunnelIdentifier = jobNum;

        multiremote['browser' + i] = {
            desiredCapabilities: browserEnv,
            host: 'localhost',
            key: testConfig.sauceAccessKey || process.env.SAUCE_ACCESS_KEY,
            port: 4445,
            user: testConfig.sauceUsername || process.env.SAUCE_USERNAME
        };
    });

    return multiremote;
}


function generateClient(multiremote) {
    // Create a multiremote client to run on multiple browsers.
    return webdriver.multiremote(multiremote)
        .init()
        .timeoutsImplicitWait(process.env.SHERLOCKED_WAIT || 30000);
}


function uploadCapture(image, browserEnv, captureName, sauceSessionId) {
    // Attach a Capture to the Sherlocked Build.
    // The ID of the Build is the Travis build ID.
    var captureUrl = url.resolve(API_ROOT, 'builds/');
    captureUrl = url.resolve(captureUrl,
                             process.env.TRAVIS_BUILD_ID.toString() + '/');
    captureUrl = url.resolve(captureUrl, 'captures/');

    console.log('    Submitting ' + captureName +
                ' evidence to Sherlocked at ' + captureUrl);
    var data = {
        browserName: browserEnv.browserName,
        browserPlatform: browserEnv.platform,
        browserVersion: browserEnv.version,
        image: image,
        name: captureName,
        sauceSessionId: sauceSessionId,
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
    if (!process.env.SAUCE_ACCESS_KEY || !process.env.SAUCE_USERNAME) {
        console.log('Missing evidence: SAUCE_ACCESS_KEY, SAUCE_USERNAME vars.');
        return;
    }
    if (!process.env.TRAVIS_JOB_NUMBER) {
        console.log('Missing evidence: TRAVIS_JOB_NUMBER var.');
        return;
    }

    // Validate the config.
    if (!validateConfig(testConfig)) {
        return;
    }

    // Create a Sherlocked Build.
    createSherlockedBuild();

    // Set up client config.
    var multiremote = getSauceConfig(testConfig);

    // Take captures.
    var testQueue = testConfig.captures.map(function(captureObj) {
        return function() {
            return new Promise(function(resolve) {
                var captureName = captureObj.name;
                var capture = captureObj.capture;

                console.log('Investigating ' + captureName + '...');

                var sessions;
                capture(generateClient(multiremote))
                    .session(function(err, res) {
                        // Get Sauce session IDs for each browser.
                        sessions = res;
                    })
                    .screenshot(function(err, browsers) {
                        // Save screenshot for each browser.
                        Object.keys(browsers).forEach(function(browser) {
                            var image = browsers[browser];
                            uploadCapture(
                                image.value,
                                multiremote[browser].desiredCapabilities,
                                captureName, sessions[browser].sessionId);
                        });
                    })
                    .end(resolve);
            });
        };
    });

    var series = new PromiseSeries();
    testQueue.forEach(function(browserTest) {
        series.add(function() {
            return browserTest();
        });
    });
    series.run(function() {
        console.log('[CASE CLOSED]');
    });

    return true;
}


module.exports = {
    run: run,
    createSherlockedBuild: createSherlockedBuild,
    generateClient: generateClient,
    getSauceConfig: getSauceConfig,
    uploadCapture: uploadCapture,
    validateConfig: validateConfig
};
