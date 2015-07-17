import React from 'react';
import {Provider} from 'react-redux';
import {Route, Router} from 'react-router';
import {history} from 'react-router/lib/BrowserHistory';
import {applyMiddleware, combineReducers, compose, createStore} from 'redux';
import persistState from 'redux-localstorage';
import persistSlicer from 'redux-localstorage-slicer';
import loggerMiddleware from 'redux-logger';
import {reduxRouteComponent,
        routerStateReducer as router} from 'redux-react-router';
import thunkMiddleware from 'redux-thunk';

import App from './containers/app';
import Build from './containers/build';
import BuildList from './containers/buildList';
import Landing from './containers/landing';

import build from './reducers/build';
import buildList from './reducers/buildList';
import site from './reducers/site';


const reducer = combineReducers({
  // The name of the reducers, as imported, will be the keys of the state tree.
  build,
  buildList,
  router,
  site
});


const createEnhancedStore = compose(
  persistState(null, {
    slicer: persistSlicer()
  }),
  applyMiddleware(
    thunkMiddleware,
    loggerMiddleware
  ),
)(createStore);


// Compose all Stores into single Store function.
const store = createEnhancedStore(reducer);


function renderRoutes() {
  return (
    <Router history={history}>
      <Route component={reduxRouteComponent(store)}>
        <Route name="app" component={App}>
          <Route name="landing" path="/" component={Landing}/>
          <Route name="build-list" path="/builds/" component={BuildList}/>
          <Route name="build-list-by-repo" path="/:user/:repo/builds/"
                 component={BuildList}/>
          <Route name="build" path="/builds/:buildId" component={Build}/>
        </Route>
      </Route>
    </Router>
  );
}


class ReduxApp extends React.Component {
  renderDevTools() {
    return;
  }
  render() {
    return (
      <div className="app-container">
        <Provider store={store}>
          {renderRoutes.bind(null)}
        </Provider>

        {this.renderDevTools()}
      </div>
    );
  }
}


React.render(<ReduxApp/>, document.querySelector('.app-container'));
