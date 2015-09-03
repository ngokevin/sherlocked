/*
  Force React to recognize that a DOM is available.
  - React will check whether a DOM is available.
  - Requiring React now will have issues since there is currently no DOM.
  - We know that we will generate a DOM later within every Mocha test.
  - Fake a window so that react/lib/ExecutionEnvironment's canUseDOM
    initializes correctly.
*/
const _jsdom = require('jsdom');
global.self = {};
global.document = _jsdom.jsdom('<html><body></body></html>');
global.window = document.parentWindow;
global.navigator = window.navigator;
global.React = require('react/addons');

global.assert = require('chai').assert;
global.jsdom = require('mocha-jsdom').bind(this, {skipWindowCheck: true});
global.sinon = require('sinon');
global.TestUtils = React.addons.TestUtils;

global.getReqMock = (res, err) => {
  return {
    send() {
      return this;
    },
    set() {
      return this;
    },
    then(cb) {
      cb(res, err);
    }
  };
};

let store = {};
global.localStorage = {
  getItem: (k) => {
    return store[k];
  },
  setItem: (k, v) => {
    store[k] = v;
  },
  removeItem: (k) => {
    delete store(k);
  },
  clear: () => {
    store = {};
  },
  length: () => {
    return Object.keys(store).length;
  }
};


afterEach(() => {
  localStorage.clear();
});


// Shortcuts.
global.helpers = {
};

global.ReactDOMHelper = {
  change: TestUtils.Simulate.change,
  click: TestUtils.Simulate.click,
  queryClass: TestUtils.findRenderedDOMComponentWithClass,
  queryClassAll: TestUtils.scryRenderedDOMComponentsWithClass,
  queryTag: TestUtils.findRenderedDOMComponentWithTag,
  queryTagAll: TestUtils.scryRenderedDOMComponentsWithTag,
  render: TestUtils.renderIntoDocument,
  submit: TestUtils.Simulate.submit,
};

global.StubRouter = {
  goBack: () => {},
  getCurrentPath: () => {},
  getCurrentRoutes: () => {},
  getCurrentPathname: () => {},
  getCurrentParams: () => {},
  getCurrentQuery: () => {},
  isActive: () => {},
  makeHref: () => {},
  makePath: () => {},
  replaceWith: () => {},
  routes: {},
  transitionTo: () => {},
};

class StubRouterProvider extends React.Component {
  static childContextTypes = {
    router: React.PropTypes.object
  };
  getChildContext() {
    return {
      router: StubRouter
    };
  }
  render() {
    return <this.props.component {...this.props}/>
  }
}
global.StubRouterProvider = StubRouterProvider;
