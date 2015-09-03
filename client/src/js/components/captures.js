import classnames from 'classnames';
import moment from 'moment';
import React from 'react';
import {resemble} from 'resemblejs';
import urljoin from 'url-join';

import ImageComparator from './imageComparator';


export default class Captures extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      imageDifferVisible: false
    };
  }

  getCaptureSrc() {
    return urljoin(process.env.CAPTURE_ROOT, this.props.capture.src);
  }

  getMasterCaptureSrc() {
    if (!this.props.masterCapture.src) {
      return null;
    }
    return urljoin(process.env.CAPTURE_ROOT, this.props.masterCapture.src);
  }

  getSauceUrl() {
    return urljoin('https://saucelabs.com/tests/',
                   this.props.capture.sauceSessionId);
  }

  toggleImageDiffer = () => {
    this.setState({
      imageDifferVisible: !this.state.imageDifferVisible
    })
  }

  render() {
    const placeholderSrc = urljoin(process.env.MEDIA_ROOT,
                     'img/placeholder.png');

    return (
      <div className="captures"
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
                <td><i className="ion-clock" title="Created"/></td>
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
                           modifiedSrc={this.getCaptureSrc()}
                           placeholderSrc={placeholderSrc}/>
          <ImageDiffer originalSrc={this.getCaptureSrc()}
                       modifiedSrc={this.getMasterCaptureSrc()}
                       visible={this.state.imageDifferVisible}/>
        </div>
      </div>
    );
  }
}


class ImageDiffer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imageDataUrl: ''
    };
  }

  componentWillReceiveProps(nextProps) {
    // Run image analysis only once.
    if (nextProps.visible && !this.state.imageDataUrl) {
      this.imageAnalysis();
    }
    this.props.visible = nextProps.visible;
  }

  imageAnalysis = () => {
    if (this.state.imageDataUrl) {
      return;
    }

    const compare = resemble(this.props.originalSrc).compareTo(
      this.props.modifiedSrc);
    compare.ignoreAntialiasing();
    compare.onComplete(imageDiffData => {
      this.setState({
        imageDataUrl: imageDiffData.getImageDataUrl(),
        misMatchPercentage: imageDiffData.misMatchPercentage
      });
    });
  }

  render() {
    const differClasses = classnames({
      'image-differ': true,
      'image-differ--visible': this.props.visible
    });
    return (
      <div className={differClasses}>
        <img src={this.state.imageDataUrl}/>
      </div>
    );
  }
}
