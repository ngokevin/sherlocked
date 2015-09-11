sherlocked
==========

[![NPM version][npm-image]][npm-url] [![Build Status](https://travis-ci.org/ngokevin/sherlocked.png?branch=master)](https://travis-ci.org/ngokevin/sherlocked)

Agnostic visual regression testing service with Sauce Labs and Travis CI.

The world of Sherlocked:

- Developer makes a pull request to GitHub.
- Travis CI builds the project, invokes Sherlocked script.
- Sherlocked script takes captures of project using Sauce Labs and uploads
  them to the API.
- A GitHub Webhook will post the pull request summarizing the visual regression
  test build and link to a Sherlocked webpage.
- The Sherlocked webpage will contain side-by-side capture comparisons of the
  master and the pull request branch as well display image diffs.

Sherlocked is hosted at
[sherlocked.dev.mozaws.net](http://sherlocked.dev.mozaws.net).

![Sherlocked on the Case](https://cloud.githubusercontent.com/assets/674727/9673673/aff66564-525b-11e5-8eda-21b81f140d40.png)


## Setup

To use Sherlocked in your project, install the Node library, get a Sauce Labs
API key, write a Sherlocked test script, and hook it into your Travis build.

```bash
npm install --save-dev sherlocked
```

### 1. Setting up Sauce Labs

You must have a [Sauce Labs](https://saucelabs.com/) account and find your API
key. Once you are logged in, you can find it at your [SauceLabs account
page](https://saucelabs.com/account) like below.

![Sauce Labs account page](https://cloud.githubusercontent.com/assets/674727/9673795/e9ec21cc-525c-11e5-8420-add113487dfd.png)

Keep your API key for later.

### 2. Writing a Sherlocked Test Script

A Sherlocked test script adds screenshots to the case with
```.investigate(captureName, captureFn)``` where ```captureFn``` operates
on a [WebdriverIO](http://webdriver.io) client. Then the investigation begins
with ```.begin(environmentList)``` where ```environmentList``` is a list of
configurations of what environments we want to take captures of, in the form of
Selenium's [desiredCapabilities]
(https://code.google.com/p/selenium/wiki/DesiredCapabilities)

```js
require('sherlocked')

.investigate('Home Page', function(client) {
    return client
        .url('http://localhost:8000')
        .waitFor('main');
})

.begin([
    {
        browserName: 'firefox',
        version: '40',
        platform: 'OS X 10.9',
    },
    {
        browserName: 'chrome',
        platform: 'OS X 10.9',
    }
]);
```

### 3. Setting up Sherlocked with Travis CI

First, you will want to encrypt your Sauce Labs API key and set it as an
environment variable in Travis CI. ```-add``` will automatically add it to
your ```.travis.yml```.

```bash
gem install travis
travis encrypt SAUCE_ACCESS_KEY=my-sauce-key --add
travis encrypt SAUCE_USERNAME=my-sauce-username --add
```

Then, you'll want to enable your Travis' ```sauce_connect``` addon to allow
Travis CI to tunnel through the firewall into Sauce Labs.

```yaml
addons:
  sauce_connect: true
```

Lastly, all you need to do is to call your Sherlocked test script from your
Travis CI build.

```bash
node my-sherlocked-script.js
```

## API

**GET /builds/**

Lists builds. Note this will not fetch related fields such as ```captures```.


**POST /builds/**

Create a build. Returns 201 on success.

Parameter | Description
--------- | -----------
travisId | The Travis build ID, retrieved from the Travis CI environment.
travisPullRequest | The pull request triggering the build, retrieved from the Travis CI environment.
travisRepoSlug | The slug of the repository (```owner_name```/```repo_name```), retrieved from the TravisCI environment.


**GET /builds/:travisId**

Get a build.

Example response:

```javascript
{
  "travisBranch": "newAwesomeDetectiveHat",
  "travisCommit": "01189998819991197253",
  "travisId": 221,
  "travisPullRequest": 222,
  "travisRepoSlug": "sherlocked/adlerjs",
  "masterBuild": {
    "travisBranch": "master",
    ...
  },
  "captures": [
    {
      "browserEnv": {
        "id": 1,
        "name": "firefox",
        "platform": "OS X 10.9",
        "version": "40",
      },
      "captures": {
        "homepageOnMobile": {
          "diff": {
            "dimensionDifferenceHeight": 0,
            "dimensionDifferenceWidth": 0,
            "isSameDimensions": 1,
            "mismatchPercentage": null,
            "src": "https://sherlocked.paas/api/captures/diff/N239"
          },
          "name": "homepageOnMobile",
          "sauceSessionId": "N239",
          "src": "https://sherlocked.paas/api/captures/N239"
        },
        "homepageOnDesktop": {
          "name": "homepageOnDesktop",
          "sauceSessionId": "N221B",
          "src": "https://sherlocked.paas/N221B.png"
        }
      },
      "masterCaptures": {
        "homepageOnMobile": {
          "name": "homepageOnMobile",
          "sauceSessionId": "N221",
          "src": "https://sherlocked.paas/N221.png"
        },
      },
  ]
}
```

**POST /builds/:buildId/captures/**

Attach a capture to a build. Returns 201 on success.

Parameter | Description
--------- | -----------
browserName | Browser that the capture was created in (e.g., ```firefox```)
browserPlatform | Browser platform that the capture was created in (e.g., ```OS X 10.9```)
browserVersion | Browser version that the capture was created in (e.g., ```40```)
image | Base64 image
name | Name of the capture (e.g., ```homePageOnDesktop```)
sauceSessionId | Sauce Labs session ID, each session generates one capture.


## Development

Sherlocked consist of several moving parts: the backend API, the npm module,
and the web frontend.

### API

The backend service consisting of the API and database. Powered by Express,
with Bookshelf as the ORM. Unfortunately, we have to upload and host images
since Sauce Labs only takes captures containing the desktop and browser
chrome whereas we want captures of the whole pages themselves.

```
npm install
node_modules/.bin/migrate
node index.js
```

This will start a server on port 1077 by default. Set SHERLOCKED_PORT
environment variable to configure it.

### npm Module

The npm module ran by consuming projects to hook Sauce Labs, Travis CI, and the
Sherlocked API together. Follow the **Setup** section on how to use it.

```
npm install --save-dev sherlocked
```

To let Sauce Labs through a firewall, use [Sauce
Connect](https://docs.saucelabs.com/reference/sauce-connect/). You download
the binary, and then run it in the background with your sauce username and
sauce key:

```
bin/sc -u my-sauce-username -k my-sauce-key
```

### Web Frontend

The frontend client that consumes the Sherlocked API, displaying image
comparisons and visual diffs. Powered by React, Gulp, and Browserify.

```
npm install
gulp
```

This will start a server on port 2118 by default.

#### Environment Variables

- SHERLOCKED_API_ROOT - API root the frontend will point to
- SHERLOCKED_CLIENT_PORT - port of the local development webserver
- SHERLOCKED_MEDIA_ROOT - media root the frontend will pull assets from
- NODE_ENV=production - build the project for production
  (e.g., excludes React development code)

[npm-url]: https://npmjs.org/package/sherlocked
[npm-image]: http://img.shields.io/npm/v/sherlocked.svg


### Running Sherlocked Manually

It is possible to run Sherlocked manually on a project from the CLI. For
development purposes to test the npm module, you can clone Sherlocked and run
```npm link``` from within the Sherlocked ```lib/``` folder.

First install and run
[Sauce Connect](https://docs.saucelabs.com/reference/sauce-connect/). This will
allow us to tunnel into Sauce Labs.

```bash
bin/sc -u my-sauce-username -k my-sauce-key -i 100

SAUCE_KEY=my-sauce-key SAUCE_USERNAME=my-sauce-username \
TRAVIS_BUILD_ID=abc TRAVIS_JOB_NUMBER=100 node ./my-sherlocked-script.js
```


## Who is Sherlocked Investigating?

Sherlocked always has clients in need.

- [Himself](https://github.com/ngokevin/sherlocked)
- [Firefox Content Tools](https://github.com/mozilla/marketplace-content-tools)
- [Firefox Marketplace](https://github.com/mozilla/fireplace)

Are you using Sherlocked? Let us know!
