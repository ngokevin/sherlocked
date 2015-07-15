import _ from 'lodash';
import React from 'react';
import Select from 'react-select';

import {browserEnvSlugify} from '../utils';


const BrowserEnvFilter = React.createClass({
  shouldComponentUpdate(nextProps, nextState) {
    // Don't update to prevent value reset, options will never change.
    return this.props.captures.length === 0;
  },
  render() {
    const browserEnvs = this.props.captures.map(capture => {
      const browserEnv = capture.browserEnv;
      return {
        value: browserEnv.id,
        label: browserEnvSlugify(browserEnv)
      };
    });

    return <Select className="browser-env-filter"
                   placeholder="Filter browser environments..."
                   searchable={false} multi={true}
                   onChange={this.props.filterBrowserEnvs}
                   name="browser-env-filter" options={browserEnvs}/>
  }
});
export {BrowserEnvFilter};


const CaptureFilter = React.createClass({
  shouldComponentUpdate(nextProps, nextState) {
    // Don't update to prevent value reset, options will never change.
    return this.props.captures.length === 0;
  },
  render() {
    let captureNames = [];
    if (this.props.captures.length) {
      // Create options using capture names.
      const captures = this.props.captures.forEach(capture => {
        captureNames = captureNames.concat(
          Object.keys(capture.captures));
      });
      captureNames = _.uniq(captureNames.sort(), true);
      captureNames = captureNames.map(captureName => (
        {value: captureName, label: captureName}
      ));
    }

    return <Select className="capture-filter"
                   placeholder="Filter captures..."
                   searchable={false} multi={true}
                   onChange={this.props.filterCaptures}
                   name="capture-filter" options={captureNames}/>
  }
});
export {CaptureFilter};
