var React = require('react');
var Router = require('react-router');
var request = require('superagent');
var url = require('url');

var API_URL = require('./config').API_URL;
var ImageComparator = require('./image-comparator');


var App = React.createClass({
    getInitialState: function() {
        return {
            title: ''
        };
    },
    render: function() {
        return <div className="app">
          <header>
            <h1 className="header-name">Sherlocked</h1>
            <h1 className="header-title">{this.state.title}</h1>
          </header>
          <main>
            <Router.RouteHandler setTitle={this.setTitle}/>
          </main>
        </div>
    },
    setTitle: function(title) {
        this.setState({
            title: title
        });
    }
});


var Build = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },
    getInitialState: function() {
        return {
            captures: [],
            buildId: this.context.router.getCurrentParams().buildId,
            travisId: 0,
            travisRepoSlug: ''
        };
    },
    componentDidMount: function() {
        // Fetch the Build from Sherlocked.
        var root = this;
        request
            .get(url.resolve(API_URL, 'builds/' + this.state.buildId))
            .end(function(err, res) {
                var data = res.body;
                root.setState(data, function() {
                    root.props.setTitle(root.createHeader());
                });
            });
    },
    getGithubUrl: function(repoSlug) {
        return url.resolve('https://github.com/', repoSlug);
    },
    getTravisUrl: function(repoSlug, travisId) {
        var tUrl = url.resolve('https://travis.ci.org/', repoSlug + '/');
        tUrl = url.resolve(tUrl, 'builds/');
        return url.resolve(tUrl, travisId.toString());
    },
    createHeader: function() {
        return <div className="build-header">
          <a className="build-header-repo-slug"
             href={this.getGithubUrl(this.state.travisRepoSlug)}>
            {this.state.travisRepoSlug}</a>
          <span className="build-header-separator">&mdash;</span>
          <a className="build-header-travis-id"
             href={this.getTravisUrl(this.state.travisRepoSlug,
                                     this.state.travisId)}>
            Travis #{this.state.travisId}</a>
        </div>
    },
    renderBrowserEnv: function(browserEnv, i) {
        return <BrowserEnv browserEnv={browserEnv} key={i}/>;
    },
    render: function() {
        return <div className="build">
          {this.createHeader()}
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
          <ImageComparator originalLabel="Master"
                           originalSrc={this.state.capture.src}
                           modifiedLabel="Branch"
                           modifiedSrc={this.state.masterCapture.src}/>
        </div>
    }
});





// Routes with react-router.
var Route = Router.Route;
var routes = <Route name="app" path="/" handler={App}>
  <Route name="build" path="/builds/:buildId" handler={Build}/>
</Route>;


// Begin investigation.
Router.run(routes, Router.HistoryLocation, function(Handler) {
  React.render(<Handler/>, document.body);
});
