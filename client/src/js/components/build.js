import _ from 'lodash';
import classnames from 'classnames';
import React from 'react';
import urlJoin from 'url-join';

import {BrowserEnvFilter, CaptureFilter} from './buildFilters';
import Captures from './captures';
import {browserEnvSlugify} from '../utils';


export default class Build extends React.Component {
  static propTypes = {
    id: React.PropTypes.number.isRequired,
    captures: React.PropTypes.array,
    travisBranch: React.PropTypes.string,
    travisCommit: React.PropTypes.string,
    travisId: React.PropTypes.number,
    travisPullRequest: React.PropTypes.number,
    travisRepoSlug: React.PropTypes.string,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      filteredBrowserEnvs: [],
      filteredCaptures: [],
    };

    this.props.setTitle(this.renderHeader());
  }

  handleFilterBrowserEnvs = browserEnvs => {
    /*
      Handle <select> filter of browserEnv, which will supply list of
      browserEnv IDs as a comma-separated string.
      We split the string and set the state of browserEnvs to filter by.
    */
    const filteredBrowserEnvs = browserEnvs ?
      _.unique(browserEnvs.split(',')).map(id => parseInt(id, 10)) :
      [];
    this.setState({
      filteredBrowserEnvs: filteredBrowserEnvs
    });
  }

  filterCaptures = captures => {
    /*
      Handle <select> filter of captures, which will supply list of
      capture names as a comma-separated string.
      We split the string and set the state of captures to filter by.
    */
    this.setState({
      filteredCaptures: captures ? _.unique(captures.split(',')) : []
    });
  }

  getGithubUrl(repoSlug) {
    return urlJoin('https://github.com/', repoSlug);
  }

  getTravisUrl(repoSlug, travisId) {
    return urlJoin('https://travis-ci.org/', repoSlug, 'builds',
                   travisId.toString());
  }

  renderHeader() {
    return <div className="build-header">
      <a className="build-header-repo-slug"
         href={this.getGithubUrl(this.props.travisRepoSlug)}>
        {this.props.travisRepoSlug}</a>

      <span className="build-header-separator">&mdash;</span>

      <a className="build-header-travis-id"
         href={this.getTravisUrl(this.props.travisRepoSlug,
                                 this.props.travisId)}>
        Travis #{this.props.travisId}</a>
    </div>
  }

  renderBrowserEnv = (browserEnv, i) => {
    const filteredBrowserEnvs = this.state.filteredBrowserEnvs;
    const isHidden = !!(
      filteredBrowserEnvs.length &&
      filteredBrowserEnvs.indexOf(browserEnv.browserEnv.id) === -1
    );
    return <BrowserEnv browserEnv={browserEnv.browserEnv}
                       captures={browserEnv.captures}
                       filteredCaptures={this.state.filteredCaptures}
                       isHidden={isHidden}
                       key={i}
                       masterCaptures={browserEnv.masterCaptures}/>
  }

  render() {
    return (
      <section className="build">
        {this.props.captures && this.props.captures.length &&
          <div>
            <BrowserEnvFilter
              captures={this.props.captures}
              filterBrowserEnvs={this.handleFilterBrowserEnvs}/>
            <CaptureFilter
              captures={this.props.captures}
              filterCaptures={this.handleFilterCaptures}/>
          </div>
        || ''}

        <div className="build-content">
          {this.props.captures && !this.props.captures.length &&
            <h2 className="error-msg">
              No evidence yet for Build #{this.props.travisId}
            </h2>
          }

          {this.props.captures && this.props.captures.length &&
            this.props.captures.map(this.renderBrowserEnv)
          || ''}
        </div>
      </section>
    );
  }
}


export class BrowserEnv extends React.Component {
  static propTypes = {
    browserEnv: React.PropTypes.object.isRequired,
    captures: React.PropTypes.object.isRequired,
    filteredCaptures: React.PropTypes.array,
    isHidden: React.PropTypes.bool,
    masterCaptures: React.PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      toggledOff: false
    };
  }

  toggle = () => {
    this.setState({toggledOff: !this.state.toggledOff});
  }

  renderCapture = (captureName, i) => {
    return <Captures capture={this.props.captures[captureName]}
             masterCapture={this.props.masterCaptures[captureName] || {}}
             key={i}/>
  }

  render() {
    const browserEnvClasses = classnames({
      'browser-env': true,
      'browser-env--toggled-off': this.state.toggledOff,
      'browser-env--hidden': this.props.isHidden,
    });

    // If filtering captures, hide rest of captures.
    let captureNames = Object.keys(this.props.captures);
    if (this.props.filteredCaptures.length) {
      captureNames = _.intersection(
        captureNames, this.props.filteredCaptures);
    }

    return (
      <div className={browserEnvClasses}>
        <div className="browser-env-header" onClick={this.toggle}>
          <h3>{browserEnvSlugify(this.props.browserEnv)}</h3>
        </div>

        <div className="browser-env-captures">
          {captureNames.map(this.renderCapture)}
        </div>
      </div>
    );
  }
}
