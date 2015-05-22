sherlocked
==========

[![NPM version][npm-image]][npm-url] [![Build Status](https://travis-ci.org/travis-ci/travis-build.png?branch=master)](https://travis-ci.org/ngokevin/sherlocked)

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

![I AM SHERLOCKED](http://imgur.com/b5jQjd7.png)

## Setup

To use Sherlocked in your project, install the Node library, get a Sauce Labs
API key, write a Sherlocked test script, and hook it into your Travis build.

```
npm install sherlocked --save
```

### 1. Setting up Sauce Labs

You must create a Sauce Labs account and generate an API key.

To let Sauce Labs through a firewall, use [Sauce
Connect](https://docs.saucelabs.com/reference/sauce-connect/). You download
the binary, and then run it in the background with your sauce username and
sauce key:

```
bin/sc -u my-sauce-username -k my-sauce-key
```

Keep the API key because we will need it for later.

### 2. Writing a Sherlocked Test Script

A Sherlocked test script adds screenshots to the case with
```.investigate(captureName, captureFn)``` where ```captureFn``` operates
on a [WebdriverIO](http://webdriver.io) client. Then the investigation begins
with ```.begin(environmentList)``` where ```environmentList``` is a list of
configurations of what environments we want to take captures of, in the form of
Selenium's [desiredCapabilities]
(https://code.google.com/p/selenium/wiki/DesiredCapabilities)

```
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

```
gem install travis
travis encrypt SAUCE_ACCESS_KEY=my-sauce-key --add
travis encrypt SAUCE_USERNAME=my-sauce-username --add
```

Lastly, all you need to do is to call your Sherlocked test script from your
Travis CI build.

```
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
          "name": "homepageOnMobile",
          "sauceSessionId": "N239",
          "src": "https://sherlocked.paas/N239.png"
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
        "homepageOnDesktop": {
          "name": "homepageOnDesktop",
          "sauceSessionId": "B239",
          "src": "https://sherlocked.paas/B239.png"
        }
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
node db.js
node index.js
```

This will start a server on port 1077 by default. Set SHERLOCKED_PORT
environment variable to configure it.

### npm Module

The npm module ran by consuming projects to hook Sauce Labs, Travis CI, and the
Sherlocked API together. Follow the **Setup** section on how to use it.

```
npm install sherlocked --save
```

### Web Frontend

The frontend client that consumes the Sherlocked API, displaying image
comparisons and visual diffs. Powered by React, Gulp, and Browserify.

```
npm install
gulp
```

This will start a server on port 2118 by default. Set SHERLOCKED_CLIENT_PORT
environment variable to configure it. Set ```NODE_ENV=production``` to build
the project for production.

[npm-url]: https://npmjs.org/package/sherlocked
[npm-image]: http://img.shields.io/npm/v/sherlocked.svg
