var React = require('react');
var request = require('browser-request');
var Router = require('react-router');
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
            buildId: this.context.router.getCurrentParams().buildId
        };
    },
    componentDidMount: function() {
        var root = this;
        request(url.resolve(API_URL, 'builds/' + this.state.buildId),
                function(err, res, build) {
            root.setState(build);
        })
    },
    render: function() {
        return <div className="build">
          {this.state.travisId}
        </div>
    }
});


var Captures = React.createClass({
    render: function() {
        return <div className="build">
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
