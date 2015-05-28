var classnames = require('classnames');
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
        return urljoin(MEDIA_URL, this.props.masterCapture.src);
    },
    toggleImageDiffer: function() {
        this.setState({
            imageDifferVisible: !this.state.imageDifferVisible
        })
    },
    render: function() {
        return <div className="captures">
          <h4>
            {this.props.capture.name}
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


module.exports = Captures;
