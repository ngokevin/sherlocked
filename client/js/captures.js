var classnames = require('classnames');
var moment = require('moment');
var React = require('react');
var resemble = require('resemblejs').resemble;
var urljoin = require('url-join');

var MEDIA_URL = require('./config').MEDIA_URL;
var ImageComparator = require('./image-comparator');


var Captures = React.createClass({
    getInitialState: function() {
        return {
            imageDifferVisible: false
        };
    },
    getCaptureSrc: function() {
        return urljoin(MEDIA_URL, this.props.capture.src);
    },
    getMasterCaptureSrc: function() {
        if (!this.props.masterCapture.src) {
            return null;
        }
        return urljoin(MEDIA_URL, this.props.masterCapture.src);
    },
    getSauceUrl: function() {
        return urljoin('https://saucelabs.com/tests/',
                       this.props.capture.sauceSessionId);
    },
    toggleImageDiffer: function() {
        this.setState({
            imageDifferVisible: !this.state.imageDifferVisible
        })
    },
    render: function() {
        return <div className="captures"
                    data-has-master-capture={!!this.props.masterCapture.src}>
          <div className="captures-controls">
            <h3>{this.props.capture.name}</h3>
            <table className="captures-metadata">
              <tr>
                <td>Name</td>
                <td>{this.props.capture.name}</td>
              </tr>
              <tr>
                <td>Sauce Labs Session</td>
                <td><a href={this.getSauceUrl()}>
                  {this.props.capture.sauceSessionId}</a></td>
              </tr>
              <tr>
                <td>Created</td>
                <td>{moment(this.props.capture.created_at)
                     .format('MM-DD-YYYY h:mma')}</td>
              </tr>
            </table>
            <button className="captures-toggle-diff"
                    onClick={this.toggleImageDiffer}>Toggle Diff</button>
          </div>
          <div className="captures-images" ref="capturesImages"
               data-image-differ--visible={this.state.imageDifferVisible}>
            <ImageComparator originalLabel="Master"
                             originalSrc={this.getMasterCaptureSrc()}
                             modifiedLabel="Branch"
                             modifiedSrc={this.getCaptureSrc()}/>
            <ImageDiffer originalSrc={this.getCaptureSrc()}
                         modifiedSrc={this.getMasterCaptureSrc()}
                         visible={this.state.imageDifferVisible}/>
          </div>
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


module.exports = Captures;
