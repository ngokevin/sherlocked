var React = require('react');
var Router = require('react-router');


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
Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.body);
});
