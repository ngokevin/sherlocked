var classnames = require('classnames');
var React = require('react');
var Router = require('react-router');
var request = require('superagent');
var resemble = require('resemblejs').resemble;
var url = require('url');

var API_URL = require('./config').API_URL;
var ImageComparator = require('./image-comparator');


var App = React.createClass({
    getInitialState: function() {
        return {
            title: ''
        };
    },
    render: function() {
        return <div className="app">
          <header>
            <h1 className="header-name">Sherlocked</h1>
            <h1 className="header-title">{this.state.title}</h1>
          </header>
          <main>
            <Router.RouteHandler setTitle={this.setTitle}/>
          </main>
        </div>
    },
    setTitle: function(title) {
        this.setState({
            title: title
        });
    }
});


var Builds = React.createClass({
    getInitialState: function() {
        return {
            builds: []
        };
    },
    componentDidMount: function() {
        // Fetch Build listing.
        var root = this;
        request
            .get(url.resolve(API_URL, 'builds/'))
            .end(function(err, res) {
                var data = res.body;
                root.setState({builds: data}, function() {
                    root.props.setTitle(<p>Builds</p>);
                });
            });
    },
    getBuildUrl: function(build) {
        return '/builds/' + build.travisId;
    },
    renderBuildLink: function(build, i) {
        return <li className="builds-build" key={i}>
          <a className="builds-link" href={this.getBuildUrl(build)}>
            <p>{build.travisRepoSlug}</p>
            <p>{build.travisId}</p>
          </a>
        </li>
    },
    render: function() {
        return <ul className="builds">
          {this.state.builds.map(this.renderBuildLink)}
        </ul>
    }
});


var Build = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },
    getInitialState: function() {
        return {
            captures: [],
            buildId: this.context.router.getCurrentParams().buildId,
            travisId: 0,
            travisRepoSlug: ''
        };
    },
    componentDidMount: function() {
        // Fetch the Build from Sherlocked.
        var root = this;
        request
            .get(url.resolve(API_URL, 'builds/' + this.state.buildId))
            .end(function(err, res) {
                var data = res.body;
                root.setState(data, function() {
                    root.props.setTitle(root.renderHeader());
                });
            });
    },
    getGithubUrl: function(repoSlug) {
        return url.resolve('https://github.com/', repoSlug);
    },
    getTravisUrl: function(repoSlug, travisId) {
        var tUrl = url.resolve('https://travis.ci.org/', repoSlug + '/');
        tUrl = url.resolve(tUrl, 'builds/');
        return url.resolve(tUrl, travisId.toString());
    },
    renderHeader: function() {
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
    renderBrowserEnv: function(browserEnv, i) {
        return <BrowserEnv browserEnv={browserEnv} key={i}/>;
    },
    render: function() {
        return <div className="build">
          {this.renderHeader()}
          <div className="build-content">
            {this.state.captures.map(this.renderBrowserEnv)}
          </div>
        </div>
    }
});


var BrowserEnv = React.createClass({
    getInitialState: function() {
        var state = this.props.browserEnv;
        state.captureNames = Object.keys(state.captures);
        state.hidden = false;
        state.maxHeight = '9999px';
        return state;
    },
    componentDidMount: function() {
        this.setState({
            maxHeight: React.findDOMNode(this.refs.browserEnvCaptures)
                            .offsetHeight
        });
    },
    toggleHidden: function() {
        this.setState({hidden: !this.state.hidden});
    },
    renderCapture: function(captureName, i) {
        return <Captures capture={this.state.captures[captureName]}
                         masterCapture={this.state.masterCaptures[captureName]}
                         key={i}>
               </Captures>
    },
    render: function() {
        var browserEnvClasses = classnames({
            'browser-env': true,
            'browser-env--hidden': this.state.hidden,
        });
        var capturesStyle = {
            maxHeight: this.state.maxHeight
        };
        return <div className={browserEnvClasses}>
          <div className="browser-env-header" onClick={this.toggleHidden}>
            <h3>{this.state.browserEnv.name}</h3>
            <h3>{this.state.browserEnv.version}</h3>
            <h3>{this.state.browserEnv.platform}</h3>
          </div>

          <div className="browser-env-captures" style={capturesStyle}
               ref="browserEnvCaptures">
            {this.state.captureNames.map(this.renderCapture)}
          </div>
        </div>
    }
});


var Captures = React.createClass({
    getInitialState: function() {
        return {
            capture: this.props.capture,
            imageDifferVisible: false,
            masterCapture: this.props.masterCapture || {},
        };
    },
    toggleImageDiffer: function() {
        this.setState({
            imageDifferVisible: !this.state.imageDifferVisible
        })
    },
    render: function() {
        return <div className="captures">
          <h4>
            {this.state.capture.name}
            <button onClick={this.toggleImageDiffer}>Toggle Diff</button>
          </h4>
          <ImageComparator originalLabel="Master"
                           originalSrc={this.state.capture.src}
                           modifiedLabel="Branch"
                           modifiedSrc={this.state.masterCapture.src}/>
          <ImageDiffer originalSrc={this.state.capture.src}
                       modifiedSrc={this.state.masterCapture.src}
                       visible={this.state.imageDifferVisible}/>
        </div>
    }
});


var ImageDiffer = React.createClass({
    getInitialState: function() {
        return {
            imageDataUrl: ''
        };
    },
    componentWillReceiveProps: function(nextProps) {
        // Run image analysis only once.
        if (nextProps.visible && !this.state.imageDataUrl) {
            this.imageAnalysis();
        }
        this.props.visible = nextProps.visible;
    },
    imageAnalysis: function() {
        var root = this;
        if (root.state.imageDataUrl) {
            return;
        }

        var compare = resemble(root.props.originalSrc).compareTo(
            root.props.modifiedSrc);
        compare.ignoreAntialiasing();
        compare.onComplete(function(imageDiffData) {
            console.log(imageDiffData.getImageDataUrl());
            root.setState({
                imageDataUrl: imageDiffData.getImageDataUrl(),
                misMatchPercentage: imageDiffData.misMatchPercentage
            });
        });
    },
    render: function() {
        var differClasses = classnames({
            'image-differ': true,
            'image-differ--visible': this.props.visible
        });
        return <div className={differClasses}>
          <img src={this.state.imageDataUrl}/>
        </div>
    }
});



// Routes with react-router.
var Route = Router.Route;
var routes = <Route name="app" path="/" handler={App}>
  <Route name="builds" path="/builds/" handler={Builds}/>
  <Route name="build" path="/builds/:buildId" handler={Build}/>
</Route>;


// Begin investigation.
Router.run(routes, Router.HistoryLocation, function(Handler) {
  React.render(<Handler/>, document.body);
});
