import _ from 'lodash';
import classnames from 'classnames';
import React from 'react';
import request from 'superagent';
import urljoin from 'url-join';

import buildFilters from './build-filters';
import Captures from './captures';
import pageTypesStore from './page-types-store';
import titleStore from './title-store';
import utils from './utils';


const Build = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState() {
    return {
      captures: [],
      buildId: this.context.router.getCurrentParams().buildId,
      filteredBrowserEnvs: [],
      filteredCaptures: [],
      notFound: false,
      travisId: 0,
      travisRepoSlug: ''
    };
  },
  componentDidMount() {
    // Fetch the Build from Sherlocked.
    var root = this;
    request
      .get(urljoin(process.env.API_ROOT, 'builds', root.state.buildId))
      .end((err, res) => {
        if (res.status === 404) {
          root.setState({
            notFound: true
          });
          titleStore.publish('Build #' + root.state.buildId +
                     ' Not Found');
        } else {
          var data = res.body;
          root.setState(data, () => {
            notFound: false,
            titleStore.publish(root.renderHeader());
          });
        }
      });

    pageTypesStore.publish(['build']);
  },
  filterBrowserEnvs(browserEnvs) {
    var filteredBrowserEnvs = browserEnvs ?  _.unique(browserEnvs.split(',')) :
                                             [];
    this.setState({
      filteredBrowserEnvs: filteredBrowserEnvs.map(id => {
        return parseInt(id, 10);
      })
    });
  },
  filterCaptures(captures) {
    this.setState({
      filteredCaptures: captures ? _.unique(captures.split(',')) : []
    });
  },
  getGithubUrl(repoSlug) {
    return urljoin('https://github.com/', repoSlug);
  },
  getTravisUrl(repoSlug, travisId) {
    return urljoin('https://travis-ci.org/', repoSlug, 'builds',
                   travisId.toString());
  },
  renderHeader() {
    return <div className="build-header">
      <a className="build-header-repo-slug"
         href={this.getGithubUrl(this.state.travisRepoSlug)}>
        {this.state.travisRepoSlug}</a>

      <span className="build-header-separator">&mdash;</span>

      <a className="build-header-travis-id"
         href={this.getTravisUrl(this.state.travisRepoSlug,
                                 this.state.travisId)}>
        Travis #{this.state.travisId}</a>
    </div>
  },
  renderBrowserEnv(browserEnv, i) {
    var filteredBrowserEnvs = this.state.filteredBrowserEnvs;
    var hidden = filteredBrowserEnvs.length &&
      filteredBrowserEnvs.indexOf(browserEnv.browserEnv.id) === -1;
    return <BrowserEnv browserEnv={browserEnv.browserEnv}
               captures={browserEnv.captures}
               masterCaptures={browserEnv.masterCaptures}
               key={i} hidden={hidden}
               filteredCaptures={this.state.filteredCaptures}/>;
  },
  renderFilters() {
    if (this.state.notFound || !this.state.id) {
      return;
    }

    return <div>
      <buildFilters.BrowserEnvFilter
        captures={this.state.captures}
        filterBrowserEnvs={this.filterBrowserEnvs}/>
      <buildFilters.CaptureFilter
        captures={this.state.captures}
        filterCaptures={this.filterCaptures}/>
    </div>
  },
  renderError() {
    if (this.state.notFound) {
      return <h2 className="error-msg">
        The scene of the crime yielded no clues for
        Build #{this.state.travisId}
      </h2>
    }
  },
  render() {
    return <div className="build">
      {this.renderFilters()}

      <div className="build-content">
        {this.renderError()}
        {this.state.captures.map(this.renderBrowserEnv)}
      </div>
    </div>
  }
});
export default Build;


const BrowserEnv = React.createClass({
  getInitialState() {
    return {
      toggledOff: false
    };
  },
  toggle() {
    this.setState({toggledOff: !this.state.toggledOff});
  },
  renderCapture(captureName, i) {
    return <Captures capture={this.props.captures[captureName]}
             masterCapture={this.props.masterCaptures[captureName] || {}}
             key={i}/>
  },
  render() {
    var browserEnvClasses = classnames({
      'browser-env': true,
      'browser-env--toggled-off': this.state.toggledOff,
      'browser-env--hidden': this.props.hidden,
    });

    // If filtering captures, hide rest of captures.
    var captureNames = Object.keys(this.props.captures);
    if (this.props.filteredCaptures.length) {
      captureNames = _.intersection(captureNames,
                      this.props.filteredCaptures);
    }

    return <div className={browserEnvClasses}>
      <div className="browser-env-header" onClick={this.toggle}>
        <h3>{utils.slugifyBrowserEnv(this.props.browserEnv)}</h3>
      </div>

      <div className="browser-env-captures">
        {captureNames.map(this.renderCapture)}
      </div>
    </div>
  }
});
