sherlocked
==========

Agnostic visual regression testing service with Sauce Labs and Travis CI.

The world of Sherlocked:

- Developer makes a pull request to GitHub.
- Travis CI builds the project, invokes Sherlocked script.
- Sherlocked script takes captures of project using Sauce Labs, pings API.
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

A Sherlocked test script specifies ```environments``` and ```captures```:

- *environments*: list of configurations of what environments we want to take
  captures of, in the form of Selenium's [desiredCapabilities]
  (https://code.google.com/p/selenium/wiki/DesiredCapabilities)
- *captures*: a list of functions that take a Webdriver client and executes
  to reach a desired state for a screen capture. Returns the client.

```
module.exports = {
    environments: [
        {
            browserName: 'firefox',
            version: '40',
            platform: 'OS X 10.9',
        },
        {
            browserName: 'chrome',
            platform: 'OS X 10.9',
        }
    ],
    captures: [
        function(client) {
            return client.setViewportSize({width: 320, height: 480})
                .url('localhost/some-page')
                .waitFor('.some-element');
        },
    ]
};
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

Parameters | Description
---------- | -----------
travisId | The Travis build ID, retrieved from the Travis CI environment.
travisPullRequest | The pull request triggering the build, retrieved from the Travis CI environment.
travisRepoSlug | The slug of the repository (```owner_name```/```repo_name```), retrieved from the TravisCI environment.


**GET /builds/:travisId**

Get a build.

Example response:

```javascript
{
  "travisId": 221,
  "travisPullRequest": 222,
  "travisRepoSlug": "sherlocked/adlerjs",
  "masterBuild": {
    "travisId": 220,
    ...
  },
  "captures": [
    "browserEnv": {
        "name": "firefox",
        "platform": "OS X 10.9",
        "version": "40",
    },
    "name": "homepageOnMobile",
    "sauceSessionId": "N239",
  ]
}
```

**POST /builds/:buildId/captures/**

Attach a capture to a build. Returns 201 on success.

Parameters | Description
---------- | -----------
browserName | Browser that the capture was created in (e.g., ```firefox```)
browserPlatform | Browser platform that the capture was created in (e.g., ```OS X 10.9```)
browserVersion | Browser version that the capture was created in (e.g., ```40```)
name | Name of the capture (e.g., ```homePageOnDesktop```)
sauceSessionId | Sauce Labs session ID, each session generates one capture.
