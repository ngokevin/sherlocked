var _ = require('lodash');
var classnames = require('classnames');
var React = require('react/addons');
var request = require('superagent');
var resemble = require('resemblejs').resemble;
var Select = require('react-select');
var url = require('url');

var API_URL = require('./config').API_URL;
var MEDIA_URL = require('./config').MEDIA_URL;
var ImageComparator = require('./image-comparator');


var Build = React.createClass({
    mixins: [React.addons.LinkedStateMixin],
    contextTypes: {
        router: React.PropTypes.func
    },
    getInitialState: function() {
        return {
            captures: [],
            buildId: this.context.router.getCurrentParams().buildId,
            filteredBrowserEnvs: [],
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
                    if (root.props.setPageTitle) {
                        root.props.setPageTitle(root.renderHeader());
                    }
                });
            });

        root.props.setPageTypes(['build']);
    },
    filterBrowserEnvs: function(browserEnvs) {
        var filteredBrowserEnvs = browserEnvs ?
            _.unique(browserEnvs.split(',')) : [];
        this.setState({
            filteredBrowserEnvs: filteredBrowserEnvs.map(function(id) {
                return parseInt(id, 10);
            })
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
        var filteredBrowserEnvs = this.state.filteredBrowserEnvs;
        var hidden =
            filteredBrowserEnvs.length &&
            filteredBrowserEnvs.indexOf(browserEnv.browserEnv.id) === -1;
        return <BrowserEnv browserEnv={browserEnv} key={i} hidden={hidden}/>;
    },
    render: function() {
        return <div className="build">
          {this.renderHeader()}
          <BrowserEnvSelect captures={this.state.captures}
                            filterBrowserEnvs={this.filterBrowserEnvs}/>
          <div className="build-content">
            {this.state.captures.map(this.renderBrowserEnv)}
          </div>
        </div>
    }
});


var BrowserEnvSelect = React.createClass({
    slugifyBrowserEnv: function(browserEnv) {
        var slug = browserEnv.name;
        if (browserEnv.version) {
            slug += ' | Version ' + browserEnv.version;
        }
        if (browserEnv.platform) {
            slug += ' | ' + browserEnv.platform;
        }
        return slug;
    },
    shouldComponentUpdate: function(nextProps, nextState) {
        // Don't update to prevent value reset, options will never change.
        if (this.props.captures.length === 0) {
            return true;
        }
        return false;
    },
    render: function() {
        var root = this;
        var browserEnvs = this.props.captures.map(function(capture) {
            var browserEnv = capture.browserEnv;
            return {
                value: browserEnv.id,
                label: root.slugifyBrowserEnv(browserEnv)
            };
        });

        return <Select ref="browserEnvSelector"
                       className="browser-env-selector"
                       placeholder="Filter browser environments..."
                       searchable={false} multi={true}
                       onChange={this.props.filterBrowserEnvs}
                       name="browser-env-selector" options={browserEnvs}/>;
    }
});


var BrowserEnv = React.createClass({
    getInitialState: function() {
        var state = this.props.browserEnv;
        state.captureNames = Object.keys(state.captures);
        state.toggledOff = false;
        state.maxHeight = '9999px';
        return state;
    },
    toggle: function() {
        this.setState({toggledOff: !this.state.toggledOff});
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
            'browser-env--toggled-off': this.state.toggledOff,
            'browser-env--hidden': this.props.hidden,
        });
        var capturesStyle = {
            maxHeight: this.state.maxHeight
        };
        return <div className={browserEnvClasses}>
          <div className="browser-env-header" onClick={this.toggle}>
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
    getCaptureSrc: function() {
        return url.resolve(MEDIA_URL, this.state.capture.src);
    },
    getMasterCaptureSrc: function() {
        return url.resolve(MEDIA_URL, this.state.masterCapture.src);
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
                           originalSrc={this.getCaptureSrc()}
                           modifiedLabel="Branch"
                           modifiedSrc={this.getMasterCaptureSrc()}/>
          <ImageDiffer originalSrc={this.getCaptureSrc()}
                       modifiedSrc={this.getMasterCaptureSrc()}
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

module.exports = Build;
