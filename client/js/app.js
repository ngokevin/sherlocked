var React = require('react');
var Router = require('react-router');
var request = require('superagent');
var url = require('url');

var API_URL = require('./config').API_URL;


var App = React.createClass({
    render: function() {
        return <div>
          <header></header>
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
          <h1>Travis Build #{this.state.travisId}</h1>
          <h2>{this.state.travisRepoSlug}</h2>
          <div>
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
        return <Capture capture={this.state.captures[captureName]}
                        masterCapture={this.state.masterCaptures[captureName]}
                        key={i}>
               </Capture>
    },
    render: function() {
        return <div className="browserEnv">
          {this.state.browserEnv.name}
          {this.state.browserEnv.platform}
          {this.state.browserEnv.version}

          {this.state.captureNames.map(this.renderCapture)}
        </div>
    }
});


var Capture = React.createClass({
    getInitialState: function() {
        return {
            capture: this.props.capture,
            masterCapture: this.props.masterCapture || {}
        };
    },
    render: function() {
        return <div className="capture">
          <ul>
            <li>Capture: {this.state.capture.sauceSessionId}</li>
            <li>Master Capture: {this.state.masterCapture.sauceSessionId}</li>
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
