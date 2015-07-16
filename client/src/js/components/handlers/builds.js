import moment from 'moment';
import React from 'react';
import Router from 'react-router';
import request from 'superagent';
import urljoin from 'url-join';

import TitleActions from '../../actions/title';


const Builds = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState() {
    const params = this.context.router.getCurrentParams();
    return {
      apiRoute: this.getApiRoute(params.user, params.repo),
      builds: [],
      notFound: false,
      userRepo: (params.user && params.repo) ? (params.user + '/' +
                                                params.repo) : '',
    };
  },
  componentDidMount() {
    this.request();
    this.setPageTitle();
  },
  getApiRoute(user, repo) {
    if (user && repo) {
      return urljoin(process.env.API_ROOT, user, repo, 'builds/');
    }
    return urljoin(process.env.API_ROOT, 'builds/');
  },
  request() {
    // Fetch Build listing.
    const root = this;
    request
      .get(this.state.apiRoute)
      .end((err, res) => {
        if (res.status === 404) {
          root.setState({
            notFound: true,
            builds: []
          });
        } else {
          root.setState({
            notFound: false,
            builds: res.body
          });
        }
      });
  },
  setPageTitle() {
    if (this.state.userRepo) {
      this.props.dispatch(TitleActions.setTitle(<p>{this.state.userRepo}</p>));
    } else {
      this.props.dispatch(TitleActions.setTitle(<p>Builds</p>));
    }
  },
  setUserRepo(user, repo) {
    this.setState({
      apiRoute: this.getApiRoute(user, repo),
      builds: [],
      userRepo: (user && repo) ?
            (user + '/' + repo) : '',
    }, () => {
      this.request();
      this.setPageTitle();
    });
  },
  renderBuildLink(build, i) {
    return <li className="builds-build" key={i}>
      <Router.Link className="builds-link" to="build"
                   params={{buildId: build.travisId}}>
        <span className="builds-link-meta">
          <p className="builds-repo-slug">{build.travisRepoSlug}</p>
        </span>
        <p className="builds-created">
          <i className="ion-clock" title="Created"/>
          <span>{moment(build.created_at).format('MM-DD-YYYY h:mma')}</span>
        </p>
      </Router.Link>
    </li>
  },
  renderBuildsSearch() {
    return <BuildsSearch setUserRepo={this.setUserRepo}/>
  },
  renderError() {
    if (this.state.notFound) {
      if (this.state.userRepo) {
        const repoSlug = this.state.userRepo;
        return <h2 className="error-msg">
          The scene of the crime yielded no clues for {repoSlug}
        </h2>
      }
      return <h2 className="error-msg">
        The scene of the crime yielded no clues</h2>
    }
  },
  render() {
    return <ul className="builds">
      {this.renderBuildsSearch()}
      {this.renderError()}
      {this.state.builds.map(this.renderBuildLink)}
    </ul>
  }
});


const BuildsSearch = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  searchBuilds(e) {
    e.preventDefault();

    let val = e.target.buildsSearch.value;
    if (val.match(/^\w+\/\w+$/)) {
      // Search for user/repo.
      val = val.split('/');
      this.context.router.transitionTo('builds-repo', {user: val[0],
                                                       repo: val[1]});
      this.props.setUserRepo(val[0], val[1]);
    } else if (val.match(/^\d+$/)) {
      // Search for Travis build.
      this.context.router.transitionTo('build', {buildId: val});
    } else if (!val) {
      this.context.router.transitionTo('builds');
      this.props.setUserRepo();
    }
  },
  render() {
    return <div className="builds-search">
      <form onSubmit={this.searchBuilds}>
      <input name="buildsSearch"
             placeholder="Search a Github user/repo or Travis #..."/>
      </form>
    </div>
  }
});


export default Builds;
