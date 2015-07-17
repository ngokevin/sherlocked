import _ from 'lodash';
import classnames from 'classnames';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import React from 'react';
import request from 'superagent';
import urljoin from 'url-join';

import {fetchDetail as fetchBuild} from '../actions/build';
import {setPageTypes, setTitle} from '../actions/site';
import Build from '../components/build';


export class BuildContainer extends React.Component {
  static propTypes = {
    build: React.PropTypes.any,
    buildId: React.PropTypes.string.isRequired,
    fetchBuild: React.PropTypes.func.isRequired,
    setPageTypes: React.PropTypes.func,
    setTitle: React.PropTypes.func
  };

  constructor(props) {
    super(props);
    this.props.fetchBuild(this.props.buildId);
    this.props.setPageTypes(['build']);
  }

  render() {
    if (this.props.build) {
      if (this.props.build.notFound) {
        return (
          <h2 className="error-msg">
            The scene of the crime yielded no clues for Build
            #{this.props.buildId}
          </h2>
        );
      } else {
        return (
          <Build {...this.props.build} setTitle={this.props.setTitle}/>
        );
      }
    } else {
      return (
        <div className="loading"></div>
      );
    }
  }
}


export default connect(
  state => ({
    build: state.build.builds[state.router.params.buildId],
    buildId: state.router.params.buildId,
  }),
  dispatch => bindActionCreators({
    fetchBuild,
    setPageTypes,
    setTitle,
  }, dispatch)
)(BuildContainer);
