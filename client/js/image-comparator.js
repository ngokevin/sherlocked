import _ from 'lodash';
import classnames from 'classnames';
import React from 'react';


const ImageComparator = React.createClass({
  getInitialState() {
    return {
      animated: false,
      dragging: false,
      imageLoaded: false,
      originalLabelVisible: false,
      resizeLabelVisible: true,
      resizePercentage: '0%',
    };
  },
  animateIfVisible() {
    // Check until comparator is in the viewport to animate it.
    const root = this;

    if (!this.state.containerWidth) {
      return;
    }

    const comparator = React.findDOMNode(root);
    const comparatorTop = comparator.getBoundingClientRect().top;

    const viewportHalf = document.body.scrollTop +
                         document.body.offsetHeight * 0.5;
    if (viewportHalf > comparatorTop) {
      root.setState({
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

    const root = this;
    const resizeInterval = setInterval(() => {
      if (!root.state.containerWidth && root.state.imageLoaded) {
        root.resizeContainer();
      } else {
        clearInterval(resizeInterval);
      }
    }, 500);

    // Check when the background-image is loaded to determine how to
    // resize the container.
    const image = new Image();
    image.src = this.props.originalSrc;
    image.onload = () => {
      root.setState({imageLoaded: true});
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
    const root = this;
    let el = React.findDOMNode(this);

    const handle = React.findDOMNode(root.refs.handle);
    const handleLeft = handle.getBoundingClientRect().left +
                       document.body.scrollLeft;
    const handleWidth = handle.offsetWidth;

    const comparator = React.findDOMNode(root);
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
      el.addEventListener('mousemove', root.dragMoveHandler);
      el.addEventListener('vmousemove', root.dragMoveHandler);
      el.addEventListener('mouseup', root.dragEndHandler);
      el.addEventListener('vmouseup', root.dragEndHandler);
      el = el.parentNode;
    }
  },
  dragMoveHandler(e) {
    e.preventDefault();
    const root = this;

    // Constrain draggable element to within container.
    let leftValue = e.pageX + root.state.handleXPos -
            root.state.handleWidth;
    if (leftValue < root.state.handleXPosMin) {
      leftValue = root.state.handleXPosMin;
    } else if (leftValue > root.state.handleXPosMax) {
      leftValue = root.state.handleXPosMax;
    }

    let resizePercentage = (leftValue + root.state.handleWidth / 2 -
                root.state.comparatorLeft);
    resizePercentage = resizePercentage * 100 /
               root.state.comparatorWidth + '%';
    root.setState({resizePercentage: resizePercentage});

    root.updateLabelVisibility();
  },
  resizeContainer() {
    this.setState({
      containerWidth: this.getDOMNode().offsetWidth
    }, this.animateIfVisible);
  },
  updateLabelVisibility: _.debounce(() => {
    // Toggle whether the label is visible based on whether the resize
    // image edges intersect with the label.
    const root = this;
    const labels = [root.refs.originalLabel, root.refs.resizeLabel];

    const resizeEl = React.findDOMNode(root.refs.resizeEl);
    const resizeElLeft = resizeEl.getBoundingClientRect().left +
                         document.body.scrollLeft;
    const resizeRight = resizeElLeft + resizeEl.offsetWidth;

    labels.forEach(_label => {
      let label = React.findDOMNode(_label);
      let labelLeft = label.getBoundingClientRect().left +
                      document.body.scrollLeft;
      if (_label.props.position == 'left') {
        root.setState({
          originalLabelVisible: labelLeft + label.offsetWidth < resizeRight
        });
      } else if (_label.props.position == 'right') {
        root.setState({
          resizeLabelVisible: labelLeft + label.offsetWidth < resizeRight
        });
      }
    });
  }, 50),
  render() {
    const comparatorClasses = classnames({
      'image-comparator': true,
      'image-comparator--animated': this.state.animated
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

    return <div className={comparatorClasses}>
      <img className="image-comparator-img" src={this.props.originalSrc}/>
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
