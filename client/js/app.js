var React = require('react');
var Router = require('react-router');
var request = require('superagent');
var url = require('url');

var API_URL = require('./config').API_URL;
var Build = require('./build');
var Landing = require('./landing');


var App = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },
    getInitialState: function() {
        return {
            pageTypes: [],
            title: ''
        };
    },
    render: function() {
        return <div className="app"
                    data-page-types={this.state.pageTypes.join(' ')}>
          <header>
            <h1 className="header-name">
              <a href="/">Sherlocked</a>
            </h1>

            <Landing.LandingNav/>

            <h1 className="header-title">{this.state.title}</h1>
          </header>
          <main>
            <Router.RouteHandler setPageTypes={this.setPageTypes}
                                 setPageTitle={this.setPageTitle}/>
          </main>
        </div>
    },
    setPageTypes: function(pageTypes) {
        this.setState({
            pageTypes: pageTypes
        });
    },
    setPageTitle: function(title) {
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

        if (root.props.setPageTitle) {
            root.props.setPageTitle(<p>Builds</p>);
        }

        request
            .get(url.resolve(API_URL, 'builds/'))
            .end(function(err, res) {
                var data = res.body;
                root.setState({builds: data});
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
  <Route name="landing" path="/" handler={Landing.Landing}/>
  <Route name="builds" path="/builds/" handler={Builds}/>
  <Route name="build" path="/builds/:buildId" handler={Build}/>
</Route>;


// Begin investigation.
Router.run(routes, Router.HistoryLocation, function(Handler) {
  React.render(<Handler/>, document.body);
});
