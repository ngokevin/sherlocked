var moment = require('moment');
var React = require('react');
var Router = require('react-router');
var request = require('superagent');
var urljoin = require('url-join');

var titleStore = require('./title-store');


var Builds = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },
    getInitialState: function() {
        var params = this.context.router.getCurrentParams();

        return {
            apiRoute: this.getApiRoute(params.user, params.repo),
            builds: [],
            notFound: false,
            userRepo: (params.user && params.repo) ?
                      (params.user + '/' + params.repo) : '',
        };
    },
    componentDidMount: function() {
        this.request();
        this.setPageTitle();
    },
    getApiRoute: function(user, repo) {
        if (user && repo) {
            return urljoin(process.env.API_ROOT, user, repo, 'builds/');
        }
        return urljoin(process.env.API_ROOT, 'builds/');
    },
    request: function() {
        // Fetch Build listing.
        var root = this;
        request
            .get(this.state.apiRoute)
            .end(function(err, res) {
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
    setPageTitle: function() {
        if (this.state.userRepo) {
            titleStore.publish(<p>{this.state.userRepo}</p>);
        } else {
            titleStore.publish(<p>Builds</p>);
        }
    },
    setUserRepo: function(user, repo) {
        this.setState({
            apiRoute: this.getApiRoute(user, repo),
            builds: [],
            userRepo: (user && repo) ?
                      (user + '/' + repo) : '',
        }, function() {
            this.request();
            this.setPageTitle();
        });
    },
    renderBuildLink: function(build, i) {
        return <li className="builds-build" key={i}>
          <Router.Link className="builds-link"
                to="build" params={{buildId: build.travisId}}>
            <span className="builds-link-meta">
              <p className="builds-repo-slug">{build.travisRepoSlug}</p>
              <p className="builds-build-id">#{build.travisId}</p>
            </span>
            <p className="builds-created">
              Created: {moment(build.created_at).format('MM-DD-YYYY h:mma')}
            </p>
          </Router.Link>
        </li>
    },
    renderBuildsSearch: function() {
        return <BuildsSearch setUserRepo={this.setUserRepo}/>
    },
    renderError: function() {
        if (this.state.notFound) {
            if (this.state.userRepo) {
                var repoSlug = this.state.userRepo;
                return <h2 className="error-msg">
                  The scene of the crime yielded no clues for {repoSlug}
                </h2>
            }
            return <h2 className="error-msg">
              The scene of the crime yielded no clues</h2>
        }
    },
    render: function() {
        return <ul className="builds">
          {this.renderBuildsSearch()}
          {this.renderError()}
          {this.state.builds.map(this.renderBuildLink)}
        </ul>
    }
});


var BuildsSearch = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },
    searchBuilds: function(e) {
        e.preventDefault();

        var val = e.target.buildsSearch.value;
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
    render: function() {
        return <div className="builds-search">
          <form onSubmit={this.searchBuilds}>
            <input name="buildsSearch"
                   placeholder="Search a Github user/repo or Travis #..."/>
          </form>
        </div>
    }
});


module.exports = Builds;
