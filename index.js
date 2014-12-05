var fs = require('fs');
var path = require('path');

document = '';
var resemble = require('resemblejs');
var webdriver = require('webdriverio');


var config = require('./config');
var app = require('./test/sauce');

var sauceUsername = config.SAUCE_USERNAME;
var sauceKey = config.SAUCE_KEY;


app.environments.forEach(function(env, i) {
    // Screenshot name generator.
    var counter = 0;
    var getScreenshotName = function() {
        var name = env.browserName;
        if (env.platform) { name += '-' + env.platform; }
        if (env.version) { name += '-' + env.version; }
        name += '-' + counter + '.png';
        return name;
    };

    // Initialize client.
    var client = webdriver.remote({
        desiredCapabilities: env,
        host: 'ondemand.saucelabs.com',
        port: 80,
        user: sauceUsername,
        key: sauceKey,
        logLevel: 'verbose'
    });

    // Take screenshots.
    app.captures.forEach(function(captureFn) {
        captureFn(client)
            .saveScreenshot(path.join('screenshots', getScreenshotName()));
    });
});
