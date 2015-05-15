var React = require('react');
var Router = require('react-router');
var request = require('superagent');
var url = require('url');

var API_URL = require('./config').API_URL;
var Build = require('./build');
var Landing = require('./landing');


var App = React.createClass({
    getInitialState: function() {
        return {
            title: ''
        };
    },
    render: function() {
        return <div className="app">
          <header>
            <h1 className="header-name">
              <a href="/">Sherlocked</a>
            </h1>
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


var Builds = React.createClass({
    getInitialState: function() {
        return {
            builds: []
        };
    },
    componentDidMount: function() {
        // Fetch Build listing.
        var root = this;
        request
            .get(url.resolve(API_URL, 'builds/'))
            .end(function(err, res) {
                var data = res.body;
                root.setState({builds: data}, function() {
                    root.props.setTitle(<p>Builds</p>);
                });
            });
    },
    getBuildUrl: function(build) {
        return '/builds/' + build.travisId;
    },
    renderBuildLink: function(build, i) {
        return <li className="builds-build" key={i}>
          <a className="builds-link" href={this.getBuildUrl(build)}>
            <p>{build.travisRepoSlug}</p>
            <p>{build.travisId}</p>
          </a>
        </li>
    },
    render: function() {
        return <ul className="builds">
          {this.state.builds.map(this.renderBuildLink)}
        </ul>
    }
});


// Routes with react-router.
var Route = Router.Route;
var routes = <Route name="app" handler={App}>
  <Route name="landing" path="/" handler={Landing}/>
  <Route name="builds" path="/builds/" handler={Builds}/>
  <Route name="build" path="/builds/:buildId" handler={Build}/>
</Route>;


// Begin investigation.
Router.run(routes, Router.HistoryLocation, function(Handler) {
  React.render(<Handler/>, document.body);
});
