var React = require('react');
var Router = require('react-router');
var request = require('superagent');
var url = require('url');

var API_URL = require('./config').API_URL;
var Build = require('./build');
var Builds = require('./builds');
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
