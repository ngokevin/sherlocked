var moment = require('moment');
var React = require('react');
var request = require('superagent');
var url = require('url');

var API_URL = require('./config').API_URL;


var Builds = React.createClass({
    getInitialState: function() {
        return {
            builds: []
        };
    },
    componentDidMount: function() {
        // Fetch Build listing.
        var root = this;

        if (root.props.setPageTitle) {
            root.props.setPageTitle(<p>Builds</p>);
        }

        request
            .get(url.resolve(API_URL, 'builds/'))
            .end(function(err, res) {
                var data = res.body;
                root.setState({builds: data});
            });
    },
    getBuildUrl: function(build) {
        return '/builds/' + build.travisId;
    },
    renderBuildLink: function(build, i) {
        return <li className="builds-build" key={i}>
          <a className="builds-link" href={this.getBuildUrl(build)}>
            <span className="builds-link-meta">
              <p className="builds-repo-slug">{build.travisRepoSlug}</p>
              <p className="builds-build-id">#{build.travisId}</p>
            </span>
            <p className="builds-created">
              Created: {moment(build.created_at).format('MM-DD-YYYY h:mma')}
            </p>
          </a>
        </li>
    },
    render: function() {
        return <ul className="builds">
          {this.state.builds.map(this.renderBuildLink)}
        </ul>
    }
});


module.exports = Builds;
