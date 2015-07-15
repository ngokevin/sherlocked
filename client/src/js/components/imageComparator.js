import _ from 'lodash';
import classnames from 'classnames';
import React from 'react';
import urlJoin from 'url-join';


const ImageComparator = React.createClass({
  getInitialState() {
    return {
      animated: false,
      containerWidth: null,
      dragging: false,
      originalImageLoaded: false,
      originalLabelVisible: false,
      resizeLabelVisible: true,
      resizePercentage: '0%',
    };
  },
  animateIfVisible() {
    // Check until comparator is in the viewport to animate it.
    if (!this.state.containerWidth) {
      return;
    }

    const comparator = React.findDOMNode(this);
    const comparatorTop = comparator.getBoundingClientRect().top;

    const viewportHalf = document.body.scrollTop +
                         document.body.offsetHeight * 0.5;
    if (viewportHalf > comparatorTop) {
      this.setState({
        animated: true,
        resizePercentage: '100%',
      });

      window.removeEventListener('scroll', this.animateIfVisible);
    }
  },
  componentDidMount() {
    if (!this.props.originalSrc || !this.props.modifiedSrc) {
      return;
    }

    window.addEventListener('scroll', this.animateIfVisible);
    window.addEventListener('resize', this.resizeContainer);

    const resizeInterval = setInterval(() => {
      if (this.state.originalImageLoaded) {
        if (!this.state.containerWidth) {
          this.resizeContainer();
        } else {
          clearInterval(resizeInterval);
        }
      }
    }, 500);

    // Check when the original image is loaded to determine how to resize the
    // container and for placeholder image.
    const image = new Image();
    image.src = this.props.originalSrc;
    image.onload = () => {
      this.setState({originalImageLoaded: true});
    };
  },
  componentWillUnmount() {
    if (!this.state.animated) {
      window.removeEventListener('scroll', this.animateIfVisible);
    }
    window.removeEventListener('resize', this.resizeContainer);
  },
  dragEndHandler(e) {
    // Remove the drag handlers once done dragging.
    if (!this.state.dragging) {
      return;
    }
    let el = React.findDOMNode(this);
    while (el) {
      el.removeEventListener('mousemove', this.dragMoveHandler);
      el.removeEventListener('vmousemove', this.dragMoveHandler);
      el.removeEventListener('mouseup', this.dragEndHandler);
      el.removeEventListener('vmouseup', this.dragEndHandler);
      el = el.parentNode;
    }

    this.setState({dragging: false});
  },
  dragStartHandler(e) {
    // Add drag handler on element and all its ancestor elements.
    let el = React.findDOMNode(this);

    const handle = React.findDOMNode(this.refs.handle);
    const handleLeft = handle.getBoundingClientRect().left +
                       document.body.scrollLeft;
    const handleWidth = handle.offsetWidth;

    const comparator = React.findDOMNode(this);
    const comparatorLeft = comparator.getBoundingClientRect().left +
                           document.body.scrollLeft;
    const comparatorWidth = comparator.offsetWidth;

    this.setState({
      comparatorLeft: comparatorLeft,
      comparatorWidth: comparatorWidth,
      dragging: true,
      handleXPos: handleLeft + handleWidth - e.pageX,
      handleXPosMin: comparatorLeft - handleWidth / 2,
      handleXPosMax: comparatorLeft + comparatorWidth - handleWidth / 2,
      handleWidth: handleWidth
    });

    while (el) {
      el.addEventListener('mousemove', this.dragMoveHandler);
      el.addEventListener('vmousemove', this.dragMoveHandler);
      el.addEventListener('mouseup', this.dragEndHandler);
      el.addEventListener('vmouseup', this.dragEndHandler);
      el = el.parentNode;
    }
  },
  dragMoveHandler(e) {
    e.preventDefault();
    // Constrain draggable element to within container.
    let leftValue = e.pageX + this.state.handleXPos -
                    this.state.handleWidth;
    if (leftValue < this.state.handleXPosMin) {
      leftValue = this.state.handleXPosMin;
    } else if (leftValue > this.state.handleXPosMax) {
      leftValue = this.state.handleXPosMax;
    }

    let resizePercentage = leftValue + this.state.handleWidth / 2 -
                           this.state.comparatorLeft;
    resizePercentage = resizePercentage * 100 /
                       this.state.comparatorWidth + '%';
    this.setState({resizePercentage: resizePercentage});

    this.updateLabelVisibility();
  },
  resizeContainer() {
    this.setState({
      containerWidth: this.getDOMNode().offsetWidth
    }, this.animateIfVisible);
  },
  updateLabelVisibility: _.debounce(function() {
    // Toggle whether the label is visible based on whether the resize
    // image edges intersect with the label.
    const labels = [this.refs.originalLabel, this.refs.resizeLabel];

    const resizeEl = React.findDOMNode(this.refs.resizeEl);
    const resizeElLeft = resizeEl.getBoundingClientRect().left +
                         document.body.scrollLeft;
    const resizeRight = resizeElLeft + resizeEl.offsetWidth;

    labels.forEach(_label => {
      let label = React.findDOMNode(_label);
      let labelLeft = label.getBoundingClientRect().left +
                      document.body.scrollLeft;
      if (_label.props.position == 'left') {
        this.setState({
          originalLabelVisible: labelLeft + label.offsetWidth < resizeRight
        });
      } else if (_label.props.position == 'right') {
        this.setState({
          resizeLabelVisible: labelLeft + label.offsetWidth < resizeRight
        });
      }
    });
  }, 50),
  render() {
    const comparatorClasses = classnames({
      'image-comparator': true,
      'image-comparator--animated': this.state.animated,
      'image-comparator--originalImageLoading': !this.state.orignalImageLoaded,
    });
    const resizeStyle = {
      backgroundImage: 'url(\'' + this.props.modifiedSrc + '\')',
      width: this.state.resizePercentage
    };

    // Need to emulate background-size: contain while not depending on
    // a percentage width to keep it fixed.
    if (this.state.containerWidth) {
      resizeStyle.backgroundSize = this.state.containerWidth + 'px auto';
    }

    let originalSrc = this.state.originalImageLoaded ?
      this.props.originalSrc :
      this.props.placeholderSrc || this.props.originalSrc;

    return <div className={comparatorClasses}>
      <img className="image-comparator-img" src={originalSrc}/>
      <ImageComparatorLabel label="Original" position="left"
                            ref="originalLabel"/>

      <div className="image-comparator-resize" ref="resizeEl"
           style={resizeStyle}>
        <ImageComparatorLabel label="Modified" position="right"
                              ref="resizeLabel"/>
      </div>

      <ImageComparatorHandle dragStart={this.dragStartHandler}
                             dragging={this.state.dragging}
                             resizePercentage={this.state.resizePercentage}
                             ref="handle"/>
    </div>
  }
});
export default ImageComparator;


const ImageComparatorHandle = React.createClass({
  componentDidMount() {
    const handle = React.findDOMNode(this);
    handle.addEventListener('mousedown', this.dragStart);
    handle.addEventListener('vmousedown', this.dragStart);
  },
  componentWillUnmount() {
    window.removeEventListener('mouseup', this.dragEnd);
    window.removeEventListener('vmouseup', this.dragEnd);
  },
  dragStart(e) {
    e.preventDefault();
    this.props.dragStart(e);
  },
  render() {
    const handleClasses = classnames({
      'image-comparator-handle': true,
      'image-comparator-handle--draggable': this.props.dragging
    });
    const handleStyle = {
      left: this.props.resizePercentage
    };
    return <span className={handleClasses} style={handleStyle}/>
  }
});


const ImageComparatorLabel = React.createClass({
  render() {
    const labelClasses = classnames({
      'image-comparator-label': true,
      'image-comparator-label--visible': this.props.visible,
    });
    return <span className={labelClasses}>
      {this.props.label}
    </span>
  }
});
