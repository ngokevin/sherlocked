import React from 'react';
import Router from 'react-router';
import request from 'superagent';
import url from 'url';
import urljoin from 'url-join';

import Build from './build';
var Builds = require('./builds');
var Landing = require('./landing');
var pageTypesStore = require('./page-types-store');
var titleStore = require('./title-store');


const App = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState() {
    return {
      pageTypes: [],
      title: ''
    };
  },
  componentDidMount() {
    var root = this;
    titleStore.subscribe(title => {
      root.setState({title: title});
    });
    pageTypesStore.subscribe(pageTypes => {
      root.setState({pageTypes: pageTypes});
    });

    // Preload placeholder image.
    const placeholderImg = new Image();
    placeholderImg.src = urljoin(process.env.MEDIA_ROOT,
                                 'img/placeholder.png');
  },
  render: function() {
    return <div className="app"
                data-page-types={this.state.pageTypes.join(' ')}>
      <header>
        <h1 className="header-name">
          <a href="/">Sherlocked</a>
        </h1>
        <a className="header-icon" href="/" title="Sherlocked"/>
        <Landing.LandingNav/>
        <h1 className="header-title">{this.state.title}</h1>
      </header>

      <main>
        <Router.RouteHandler/>
      </main>
    </div>
  },
});


// Routes with react-router.
var Route = Router.Route;
var routes = <Route name="app" handler={App}>
  <Route name="landing" path="/" handler={Landing.Landing}/>
  <Route name="builds" path="/builds/" handler={Builds}/>
  <Route name="builds-repo" path="/:user/:repo/builds/" handler={Builds}/>
  <Route name="build" path="/builds/:buildId" handler={Build}/>
</Route>;


// Begin investigation.
Router.run(routes, Router.HistoryLocation, Handler => {
  React.render(<Handler/>, document.body);
});
