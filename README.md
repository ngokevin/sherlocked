sherlocked
==========

Agnostic visual regression testing service.

```
npm install
node index.js
```

## Sauce Labs

You must create a Sauce Labs account and generate an API key. In config.js,
specify SAUCE_USERNAME and SAUCE_KEY:

```
module.exports = {
    SAUCE_USERNAME: 'my-sauce-username',
    KEYSAUCE_: 'my-sauce-key'
};
```

To open up Sauce Labs through a firewall, use [Sauce
Connect](https://docs.saucelabs.com/reference/sauce-connect/). You download
the binary, and then run it in the background with your sauce username and
sauce key:

```
bin/sc -u my-sauce-username -k my-sauce-key
```

## Writing Tests

A test file specifies ```environments``` and ```captures```:

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
            return client.init()
                         .setViewportSize({
                            width: 320,
                            height: 480,
                         })
                         .url('localhost/some-page')
                         .waitFor('.some-element');
        },
    ]
};
```
