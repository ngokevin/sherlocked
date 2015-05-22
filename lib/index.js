/*
    Module that creates captures from Sauce Labs from a Sherlocked test script.
    Uses webdriverio's multiremote (not yet in stable).
*/
var fs = require('fs');
var path = require('path');
var url = require('url');

var _ = require('lodash');
var Promise = require('es6-promise').Promise;
var PromiseSeries = require('promise-series');
var request = require('superagent');
var requestMock = require('superagent-mock');
var webdriver = require('webdriverio-master');

var testConfig = require('./test-config');


if (process.env.NODE_ENV === 'test') {
    requestMock(request, testConfig);
}


// Or http://localhost:1077/api/ for development.
var API_ROOT = process.env.SHERLOCKED_API ||
               'http://sherlocked.dev.mozaws.net/api/';


var captures = [];


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


function createBuild() {
    // Create a Sherlocked Build.
    var buildUrl = url.resolve(API_ROOT, 'builds/');
    var data = {
        travisBranch: process.env.TRAVIS_BRANCH,
        travisCommit: process.env.TRAVIS_COMMIT,
        travisId: process.env.TRAVIS_BUILD_ID,
        travisPullRequest: process.env.TRAVIS_PULL_REQUEST,
        travisRepoSlug: process.env.TRAVIS_REPO_SLUG
    };

    console.log('\nThe Adventure of the ' + verb + ' Build: ' +
                buildUrl.replace(/\/api/, '') +
                process.env.TRAVIS_BUILD_ID + '\n');

    return new Promise(function(resolve, reject) {
        request.post(buildUrl)
            .send(data)
            .set('Accept', 'application/json')
            .end(function(err, res) {
                if (err) {
                    console.log('\nWhere is Sherlock when you need him?');
                    console.log('    Error: ' + API_ROOT +
                                ' could not be found.');
                    return reject(err.statusCode);
                }
                resolve(data);
            });
    });
}


function generateClient(multiremote) {
    // Create a multiremote client to run on multiple browsers.
    return webdriver.multiremote(multiremote)
        .init()
        .timeoutsImplicitWait(process.env.SHERLOCKED_WAIT || 30000);
}


function getSauceConfig(environments) {
    // Set up client config.
    var multiremote = {};
    environments.forEach(function(browserEnv, i) {
        // Use ondemand.saucelabs.com:80 if no firewall.
        // Use localhost:4445 for Sauce Connect.
        var jobNum = process.env.TRAVIS_JOB_NUMBER;
        browserEnv['tunnel-identifier'] = jobNum;
        browserEnv.tunnelIdentifier = jobNum;

        multiremote['browser' + i] = {
            desiredCapabilities: browserEnv,
            host: 'localhost',
            key: process.env.SAUCE_ACCESS_KEY,
            port: 4445,
            user: process.env.SAUCE_USERNAME
        };
    });

    return multiremote;
}


function investigate(name, captureFn) {
    // Add a capture to the investigation.
    var error = false;

    function err(msg) {
        console.error(msg);
        error = true;
    }

    if (!name || !captureFn) {
        err('Missing evidence (arguments) for .investigate(name, captureFn)');
    }
    if (name && name.constructor !== String) {
        err('`name` for .investigate(name, captureFn) must be a String.');
    }
    if (captureFn && captureFn.constructor !== Function) {
        err('`captureFn` for .investigate(name, captureFn) must be a ' +
            'Function.');
    }

    if (!error) {
        captures.push({
            name: name,
            capture: captureFn
        });
    }

    return {
        investigate: investigate,
        error: error
    };
}


function start(environments) {
    if (!process.env.SAUCE_ACCESS_KEY || !process.env.SAUCE_USERNAME) {
        console.log('Missing evidence: SAUCE_ACCESS_KEY, SAUCE_USERNAME vars.');
        return;
    }
    if (!process.env.TRAVIS_JOB_NUMBER) {
        console.log('Missing evidence: TRAVIS_JOB_NUMBER var.');
        return;
    }

    // Validation.
    if (!validateEnvironments(environments)) {
        return;
    }
    if (!validateCaptures(captures)) {
        return;
    }

    // Create a Sherlocked Build.
    createBuild().then(function() {}, function(err) {
        process.exit(1);
    });

    // Set up client config.
    var multiremote = getSauceConfig(environments);

    // Take captures.
    var testQueue = captures.map(function(captureObj) {
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

    return new Promise(function(resolve, reject) {
        request.post(captureUrl)
            .send(data)
            .set('Accept', 'application/json')
            .end(function(err, res) {
                if (err) {
                    console.log('    Error submitting capture (' +
                                err.statusCode + ')');
                    return reject(err.statusCode);
                }
                return resolve(data);
            });
    });
}


function validateEnvironments(environments) {
    var error = false;

    function err(msg) {
        console.error(msg);
        error = true;
    }

    // Check environments.
    if (!environments ||
        environments.constructor !== Array) {
        err('`environments` not found or not an array. Enlighten ' +
            'the case by providing a list of browser environments ' +
            'in the form of Selenium desiredCapabilities.');
    }

    return !error;
}


function validateCaptures(captures) {
    var error = false;

    function err(msg) {
        console.error(msg);
        error = true;
    }

    // Check captures.
    if (!captures || !captures.length || captures.constructor !== Array) {
        err('No captures were submitted for investigation. ' +
            'Use sherlocked.investigate(name, captureFn) to add a capture.');
    } else {
        // Check for duplicate capture names.
        var numUniqueNames = _.uniq(captures.map(function(cObj) {
            return cObj.name;
        })).length;
        if (numUniqueNames !== captures.length) {
            err('Redundant evidence found in the case. Examine ' +
                'that all capture names are unique.');
        }
    }

    return !error;
}


module.exports = {
    investigate: investigate,
    start: start,

    createBuild: createBuild,
    generateClient: generateClient,
    getCaptures: function() {
        return captures;
    },
    getSauceConfig: getSauceConfig,
    uploadCapture: uploadCapture,
    setCaptures: function(_captures) {
        captures = _captures;
    },
    validateCaptures: validateCaptures,
    validateEnvironments: validateEnvironments,
};
