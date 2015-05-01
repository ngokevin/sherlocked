var React = require('react');
var Router = require('react-router');
var request = require('superagent');
var url = require('url');

var API_URL = require('./config').API_URL;


var App = React.createClass({
    render: function() {
        return <div className="app">
          <header>
            <h1>Sherlocked</h1>
          </header>
          <main>
            <Router.RouteHandler/>
          </main>
        </div>
    },
});


var Build = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },
    getInitialState: function() {
        return {
            captures: [],
            buildId: this.context.router.getCurrentParams().buildId
        };
    },
    componentDidMount: function() {
        // Fetch the Build from Sherlocked.
        var root = this;
        request
            .get(url.resolve(API_URL, 'builds/' + this.state.buildId))
            .end(function(err, res) {
                root.setState(res.body);
            });
    },
    renderBrowserEnv: function(browserEnv, i) {
        return <BrowserEnv browserEnv={browserEnv} key={i}/>;
    },
    render: function() {
        return <div className="build">
          <div className="build-header">
            <h2>{this.state.travisRepoSlug}</h2>
            &mdash;
            <h2>Travis Build #{this.state.travisId}</h2>
          </div>
          <div className="build-content">
            {this.state.captures.map(this.renderBrowserEnv)}
          </div>
        </div>
    }
});


var BrowserEnv = React.createClass({
    getInitialState: function() {
        var state = this.props.browserEnv;
        state.captureNames = Object.keys(state.captures);
        return state;
    },
    renderCapture: function(captureName, i) {
        return <Captures capture={this.state.captures[captureName]}
                        masterCapture={this.state.masterCaptures[captureName]}
                        key={i}>
               </Captures>
    },
    render: function() {
        return <div className="browser-env">
          <div className="browser-env-header">
            <h3>{this.state.browserEnv.name}</h3>
            <h3>{this.state.browserEnv.version}</h3>
            <h3>{this.state.browserEnv.platform}</h3>
          </div>

          <div className="browser-env-captures">
            {this.state.captureNames.map(this.renderCapture)}
          </div>
        </div>
    }
});


var Captures = React.createClass({
    getInitialState: function() {
        return {
            capture: this.props.capture,
            masterCapture: this.props.masterCapture || {}
        };
    },
    render: function() {
        return <div className="captures">
          <h4>{this.state.capture.name}</h4>
          <ul>
            <li>
              <img src={this.state.capture.src}
                   className="capture capture--branch"/>
            </li>
            <li>
              <img src={this.state.masterCapture.src}
                   className="capture capture--master"/>
            </li>
          </ul>
        </div>
    }
});


// Routes with react-router.
var Route = Router.Route;
var routes = <Route name="app" path="/" handler={App}>
  <Route name="build" path="/builds/:buildId" handler={Build}/>
</Route>;


// Begin investigation.
Router.run(routes, Router.HistoryLocation, function (Handler) {
  React.render(<Handler/>, document.body);
});
