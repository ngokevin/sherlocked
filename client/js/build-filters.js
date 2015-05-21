var _ = require('lodash');
var React = require('react');
var Select = require('react-select');


var BrowserEnvFilter = React.createClass({
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

        return <Select className="browser-env-filter"
                       placeholder="Filter browser environments..."
                       searchable={false} multi={true}
                       onChange={this.props.filterBrowserEnvs}
                       name="browser-env-filter" options={browserEnvs}/>;
    }
});


var CaptureFilter = React.createClass({
    shouldComponentUpdate: function(nextProps, nextState) {
        // Don't update to prevent value reset, options will never change.
        if (this.props.captures.length === 0) {
            return true;
        }
        return false;
    },
    render: function() {
        var root = this;

        var captureNames = [];
        if (this.props.captures.length) {
            // Create options using capture names.
            var captures = this.props.captures.forEach(function(capture) {
                captureNames = captureNames.concat(
                    Object.keys(capture.captures));
            });
            captureNames = _.uniq(captureNames.sort(), true);
            captureNames = captureNames.map(function(captureName) {
                return {value: captureName, label: captureName};
            });
        }

        return <Select className="capture-filter"
                       placeholder="Filter captures..."
                       searchable={false} multi={true}
                       onChange={this.props.filterCaptures}
                       name="capture-filter" options={captureNames}/>;
    }
});


module.exports = {
    BrowserEnvFilter: BrowserEnvFilter,
    CaptureFilter: CaptureFilter
};
