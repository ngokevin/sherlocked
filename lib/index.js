var fs = require('fs');
var path = require('path');

var webdriver = require('webdriverio');


function run(testConfig) {
    testConfig.environments.forEach(function(env, i) {
        // Screenshot name generator.
        var counter = 0;
        var getScreenshotName = function() {
            var name = env.browserName;
            if (env.platform) { name += '-' + env.platform; }
            if (env.version) { name += '-' + env.version; }
            name += '-' + counter + '.png';
            return name.replace(/ /g, '-');
        };

        // Initialize client.
        var client = webdriver.remote({
            desiredCapabilities: env,
            /* Use ondemand.saucelabs.com:80 if no firewall.
               host: 'ondemand.saucelabs.com',
               port: 80,
            */
            // Use localhost:4445 for Sauce Connect.
            host: 'localhost',
            port: 4445,
            user: process.env.SAUCE_USERNAME || testConfig.SAUCE_USERNAME,
            key: process.env.SAUCE_KEY || testConfig.SAUCE_KEY,
            logLevel: 'verbose'
        });

        // Take screenshots.
        testConfig.captures.forEach(function(captureFn) {
            captureFn(client)
                .saveScreenshot(path.join('screenshots', getScreenshotName()))
                .end();
        });
    });
}

module.exports = {
    run: run
};
