/*
  Initializes the app.
  Instantiates Redux the long way to add Promise support.
*/
import {createRedux, createDispatcher, compose, composeStores} from 'redux';
import {Provider} from 'redux/react';
import React from 'react';
import {reduxRouteComponent} from 'redux-react-router';
import Router from 'react-router';
import thunkMiddleware from 'redux/lib/middleware/thunk';

import App from './components/app';
import Build from './components/handlers/build';
import Builds from './components/handlers/builds';
import Landing from './components/handlers/landing';
import PageTypesStore from './stores/pageTypes';
import {promiseMiddleware} from './lib/reduxHelpers';
import TitleStore from './stores/title';


// Compose all Stores into single Store function.
const store = composeStores({
  PageTypes: PageTypesStore,
  Title: TitleStore,
});

// Create Dispatcher function for composite Store.
// thunkMiddleware is default middleware.
const dispatcher = createDispatcher(
  store,
  getState => [promiseMiddleware(), thunkMiddleware(getState)]
);

// Create Redux instance using the dispatcher.
const redux = createRedux(dispatcher);


// Routes with react-router.
const Route = Router.Route;
const routes = <Route component={reduxRouteComponent(store)}>
  <Route name="app" handler={App}>
    <Route name="landing" path="/" handler={Landing.Landing}/>
    <Route name="builds" path="/builds/" handler={Builds}/>
    <Route name="builds-repo" path="/:user/:repo/builds/" handler={Builds}/>
    <Route name="build" path="/builds/:buildId" handler={Build}/>
  </Route>
</Route>;


Router.run(routes, Router.HistoryLocation, function(Handler) {
  const App = <Provider redux={redux}>
    {() => <Handler/>}
  </Provider>
  React.render(App, document.body);
});
