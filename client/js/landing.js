require('./lib/prism');
var classnames = require('classnames');
var React = require('react');


var Landing = React.createClass({
    getInitialState: function() {
        return {
            graphicLetterGroups: [
                'I AM'.split(''),
                'SHER'.split(''),
                'LOCKED'.split('')
            ]
        };
    },
    componentDidMount: function() {
        if (this.props.setPageTypes) {
            this.props.setPageTypes(['landing']);
        }
    },
    renderGraphicLetter: function(letter, i) {
        var graphicLetterClasses = classnames({
            'landing-graphic-letter': true,
            'landing-graphic-space': letter === ' '
        });
        return <h1 className={graphicLetterClasses}
                   data-graphic-letter-index={i}>
          <span>{letter}</span>
        </h1>
    },
    renderGraphicLetterGroup: function(letters, i) {
        return <div className="landing-graphic-letter-group"
                    data-graphic-letter-group-index={i}>
          {letters.map(this.renderGraphicLetter)}
        </div>
    },
    render: function() {
        return <div className="landing">
          <div className="landing-graphic">
            <div className="landing-graphic-letters">
              {this.state.graphicLetterGroups.map(
               this.renderGraphicLetterGroup)}
            </div>
          </div>
          <div className="landing-info">
            <h2>
              I am Sherlocked, the world's greatest visual regression testing
              service.
            </h2>
            <h3>
              And it is my business to know what other people don't know.
            </h3>

            <ul className="landing-brief-desc">
              <li>
                <h2>Visual Testing</h2>
                <p>
                  Quickly gather all the clues whenever your app is visually
                  affected, whether the changes be pre-meditated or a crime of
                  passion. Sherlocked holds the power of observation.
                </p>
              </li>
              <li>
                <h2>Continuous Integration</h2>
                <p>
                  A full-fledged investigation run on every Github pull
                  request. <a href="http://travis-ci.org"> TravisCI</a>, your
                  trust-worthy sidekick will handle the mundane portions of the
                  case.
                </p>
              </li>
              <li>
                <h2>Sauce Labs</h2>
                <p>
                  Have eyes and ears all over the streets. Sherlocked combines
                  the powers of Sauce Labs, Github, and TravisCI to make sure
                  no browser environment goes unquestioned.
                </p>
              </li>
            </ul>

            <div className="landing-usage">
              <h2>Need me on the case?</h2>
              <ul>
                <li>
                  <h3>1. Create a Sauce Labs account</h3>
                  <p>
                    <a href="https://saucelabs.com/">Sauce Labs</a> has a
                    sturdy Selenium grid which enables Sherlocked to easily do
                    cross-browser testing. It is free for open-source projects,
                    and you should check out Sauce Labs anyways as it offers an
                    entire suite for testing. After creating an account, you
                    will need to jot down your Sauce username and API access
                    key.
                  </p>
                </li>
                <li>
                  <h3>2. Write a simple test script</h3>
                  <p>
                    You will need to offer Sherlocked some clues on what you
                    want tested. Don't worry though, writing a test script for
                    Sherlocked is easy. Install sherlocked from npm, and pass
                    it a list of browser environments and an object defining
                    <a href="http://webdriver.io/"> WebdriverIO</a> captures.
                    Sherlocked will supply the WebdriverIO clients and handle
                    the case.
                  </p>
                </li>
                <li>
                  <h3>3. Hook it into Travis CI</h3>
                  <p>
                    Then all you need to do is call on your Sherlocked test
                    script in your .travis.yml file with Node. Sherlocked will
                    take captures, upload it to our service, handle all of
                    the investigation for you, and let you know the culprits
                    via a Github hook.
                  </p>
                </li>
              </ul>
            </div>

            <LandingTestExample/>
            <LandingTravisExample/>
          </div>
        </div>
    },
});


var LandingTestExample = React.createClass({
    getTestExample: function() {
        return [
            "require('sherlocked')",
            ".investigate('Home Page', function(client) {",
            "    return client",
            "        .url('http://localhost:8000')",
            "        .waitForExist('main');",
            "})",
            ".start([",
            "    {browserName: 'firefox'},",
            "    {browserName: 'chrome', 'version': '40'}",
            "]);"
        ].join('\n');
    },
    render: function() {
        return <div className="landing-test-example">
          <h2>Writing a Test Script</h2>

          <p>
            Install the Sherlocked Node module which abstracts communication
            with the Sherlocked service and Sauce Labs away.
          </p>

          <pre><code className="language-bash">
            npm install sherlocked --save
          </code></pre>

          <p>
            Then simply pass in the browser environments you want to test
            (in the form of Selenium's
            <code> desiredCapabilities</code>) and an object
            describing which parts of your app to test (in the form of
            functions that take/operate/return a
            <a href="http://webdriver.io"> WebdriverIO</a> client) into
            <code> sherlocked.run</code>.
          </p>

          <pre><code className="language-javascript">
            {this.getTestExample()}
          </code></pre>
        </div>
    }
});


var LandingTravisExample = React.createClass({
    getEncryptExample: function() {
        return [
            "gem install travis",
            "travis encrypt SAUCE_ACCESS_KEY=my-sauce-key --add",
            "travis encrypt SAUCE_USERNAME=my-sauce-username --add"
        ].join('\n');
    },
    getTravisExample: function() {
        return [
            "node_js:",
            "  - '0.1.0'",
            "addons:",
            "  sauce_connect: true",
            "env:",
            "  global",
            "    - secure: <ENCRYPTED SAUCE_ACCESS_KEY>",
            "    - secure: <ENCRYPTED SAUCE_USERNAME>",
            "script:",
            "  python -m SimpleHTTPServer",
            "  node sherlocked-test.js",
        ].join('\n');
    },
    render: function() {
        return <div className="landing-travis-example">
          <h2>Hooking into Travis CI</h2>

          <p>
            In your .travis.yml, we first need to set up Sauce Connect. This
            allows Sauce Labs to tunnel requests into the Travis CI
            environment. Sauce Connect (as well Sherlocked) requires
            SAUCE_USERNAME and SAUCE_ACCESS_KEY exported as environment
            variables. We can securely encrypt and add those variables to our
            .travis.yml.
          </p>

          <pre><code className="language-bash">
            {this.getEncryptExample()}
          </code></pre>

          <p>
            Then we simply add use the Sauce Connect addon provided by Travis
            CI, and invoke the test script we wrote earlier. Your .travis.yml
            should look something like below:
          </p>

          <pre><code className="language-yaml">
            {this.getTravisExample()}
          </code></pre>
        </div>
    }
});


var LandingNav = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },
    render: function() {
        return <nav className="landing-nav">
          <ul>
            <li><a href={this.context.router.namedRoutes.builds.path}>
              Builds</a></li>
          </ul>
        </nav>;
    }
});


module.exports = {
    Landing: Landing,
    LandingNav: LandingNav,
};
