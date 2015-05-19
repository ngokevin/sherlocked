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
                  request. TravisCI, your trust-worthy sidekick will handle
                  the mundane portions of the case.
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
                    <a href="http://webdriver.io/">WebdriverIO</a> captures.
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
          </div>
        </div>
    },
});

module.exports = Landing;
