import React from 'react';
import Router from 'react-router';

import App from './components/app';
import Build from './components/handlers/build';
import Builds from './components/handlers/builds';
import Landing from './components/handlers/landing';


// Routes with react-router.
const Route = Router.Route;
const routes = <Route name="app" handler={App}>
  <Route name="landing" path="/" handler={Landing.Landing}/>
  <Route name="builds" path="/builds/" handler={Builds}/>
  <Route name="builds-repo" path="/:user/:repo/builds/" handler={Builds}/>
  <Route name="build" path="/builds/:buildId" handler={Build}/>
</Route>;


export default routes;
