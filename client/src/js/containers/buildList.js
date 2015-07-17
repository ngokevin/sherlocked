import moment from 'moment';
import React from 'react';
import {connect} from 'react-redux';
import {ReverseLink} from 'react-router-reverse';
import {bindActionCreators} from 'redux';
import request from 'request';
import urljoin from 'url-join';

import {fetchList as fetchBuildList} from '../actions/build';
import {setPageTypes, setTitle} from '../actions/site';
import Search from '../components/search';


export class BuildListContainer extends React.Component {
  static propTypes = {
    builds: React.PropTypes.array.isRequired,
    fetchBuildList: React.PropTypes.func.isRequired,
    notFound: React.PropTypes.bool,
    repo: React.PropTypes.string,
    setPageTypes: React.PropTypes.func.isRequired,
    setTitle: React.PropTypes.func.isRequired,
    user: React.PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.props.fetchBuildList(this.props.user, this.props.repo);
    this.props.setPageTypes(['build-list']);
    this.props.setTitle(<p>{this.getRepoSlug() || 'Builds'}</p>);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.user !== this.props.user ||
        prevProps.repo !== this.props.repo) {
      this.props.fetchBuildList(this.props.user, this.props.repo);
      this.props.setTitle(<p>{this.getRepoSlug() || 'Builds'}</p>);
    }
  }

  getRepoSlug() {
    if (this.props.user && this.props.repo) {
      return `${this.props.user}/${this.props.repo}`;
    }
  }

  render404() {
    if (this.props.user && this.props.repo) {
      return (
        <h2 className="error-msg">
          The scene of the crime yielded no clues for {this.getRepoSlug()}
        </h2>
      );
    } else {
      return (
        <h2 className="error-msg">
          The scene of the crime yielded no clues
        </h2>
      );
    }
  }

  renderBuildLink(build, i) {
    return (
      <li className="build-list-build" key={i}>
        <ReverseLink className="build-list-link"
                     to="build" params={{buildId: build.travisId}}>
          <span className="build-list-link-meta">
            <p className="build-list-repo-slug">{build.travisRepoSlug}</p>
          </span>
          <p className="build-list-created">
            <i className="ion-clock" title="Created"/>
            <span>{moment(build.created_at).format('MM-DD-YYYY h:mma')}</span>
          </p>
        </ReverseLink>
      </li>
    );
  }

  render() {
    return (
      <section className="build-list-container">
        <Search/>

        {this.props.notFound && this.render404()}

        <ul className="build-list">
          {this.props.builds.map(this.renderBuildLink)}
        </ul>
      </section>
    );
  }
}


export default connect(
  state => ({
    builds: state.buildList.builds,
    notFound: state.buildList.notFound,
    repo: state.router.params.repo,
    user: state.router.params.user,
  }),
  dispatch => bindActionCreators({
    fetchBuildList,
    setPageTypes,
    setTitle
  }, dispatch)
)(BuildListContainer);
