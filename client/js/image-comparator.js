var _ = require('lodash');
var classnames = require('classnames');
var React = require('react');


var ImageComparator = React.createClass({
    getInitialState: function() {
        return {
            animated: false,
            dragging: false,
            originalLabelVisible: false,
            resizeLabelVisible: true,
            resizePercentage: '0%',
        };
    },
    animateIfVisible: function() {
        // Check until comparator is in the viewport to animate it.
        var root = this;

        var comparator = React.findDOMNode(root);
        var comparatorTop = comparator.getBoundingClientRect().top;

        var viewportHalf = document.body.scrollTop +
                           document.body.offsetHeight * 0.5;
        if (viewportHalf > comparatorTop) {
            root.setState({
                animated: true,
                resizePercentage: '100%',
            });

            window.removeEventListener('scroll', this.animateIfVisible);
        }
    },
    componentDidMount: function() {
        if (!this.props.originalSrc || !this.props.modifiedSrc) {
            return;
        }

        window.addEventListener('scroll', this.animateIfVisible);
        window.addEventListener('resize', this.resizeContainer);

        this.animateIfVisible();
        this.resizeContainer();
    },
    componentWillUnmount: function() {
        if (!this.state.animated) {
            window.removeEventListener('scroll', this.animateIfVisible);
        }
        window.removeEventListener('resize', this.resizeContainer);
    },
    dragEndHandler: function(e) {
        // Remove the drag handlers once done dragging.
        if (!this.state.dragging) {
            return;
        }
        var el = React.findDOMNode(this);
        while (el) {
            el.removeEventListener('mousemove', this.dragMoveHandler);
            el.removeEventListener('vmousemove', this.dragMoveHandler);
            el.removeEventListener('mouseup', this.dragEndHandler);
            el.removeEventListener('vmouseup', this.dragEndHandler);
            el = el.parentNode;
        }

        this.setState({dragging: false});
    },
    dragStartHandler: function(e) {
        // Add drag handler on element and all its ancestor elements.
        var root = this;
        var el = React.findDOMNode(this);

        var handle = React.findDOMNode(root.refs.handle);
        var handleLeft = handle.getBoundingClientRect().left +
                         document.body.scrollLeft;
        var handleWidth = handle.offsetWidth;

        var comparator = React.findDOMNode(root);
        var comparatorLeft = comparator.getBoundingClientRect().left +
                             document.body.scrollLeft;
        var comparatorWidth = comparator.offsetWidth;

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
    dragMoveHandler: function(e) {
        e.preventDefault();
        var root = this;

        // Constrain draggable element to within container.
        leftValue = e.pageX + root.state.handleXPos - root.state.handleWidth;
        if (leftValue < root.state.handleXPosMin) {
            leftValue = root.state.handleXPosMin;
        } else if (leftValue > root.state.handleXPosMax) {
            leftValue = root.state.handleXPosMax;
        }

        var resizePercentage = (leftValue + root.state.handleWidth / 2 -
                                root.state.comparatorLeft);
        resizePercentage = resizePercentage * 100 /
                           root.state.comparatorWidth + '%';
        root.setState({resizePercentage: resizePercentage});

        root.updateLabelVisibility();
    },
    resizeContainer: function() {
        this.setState({
            containerWidth: this.getDOMNode().offsetWidth
        });
    },
    updateLabelVisibility: _.debounce(function() {
        // Toggle whether the label is visible based on whether the resize
        // image edges intersect with the label.
        var root = this;
        var labels = [root.refs.originalLabel, root.refs.resizeLabel];

        var resizeEl = React.findDOMNode(root.refs.resizeEl);
        var resizeElLeft = resizeEl.getBoundingClientRect().left +
                           document.body.scrollLeft;
        var resizeRight = resizeElLeft + resizeEl.offsetWidth;

        labels.forEach(function(_label) {
            var label = React.findDOMNode(_label);
            var labelLeft = label.getBoundingClientRect().left +
                            document.body.scrollLeft;
            if (_label.props.position == 'left') {
                root.setState({
                    originalLabelVisible: labelLeft + label.offsetWidth <
                                          resizeRight
                });
            } else if (_label.props.position == 'right') {
                root.setState({
                    resizeLabelVisible: labelLeft + label.offsetWidth <
                                        resizeRight
                });
            }
        });
    }, 50),
    render: function() {
        var comparatorClasses = classnames({
            'image-comparator': true,
            'image-comparator--animated': this.state.animated
        });
        var resizeStyle = {
            backgroundImage: 'url(\'' + this.props.modifiedSrc + '\')',
            width: this.state.resizePercentage
        };

        // Need to emulate background-size: contain while not depending on
        // a percentage width to keep it fixed.
        if (this.state.containerWidth) {
            resizeStyle.backgroundSize = this.state.containerWidth + 'px auto';
        }

        return <div className={comparatorClasses}>
          <img className="image-comparator-img"
               src={this.props.originalSrc}/>
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


var ImageComparatorHandle = React.createClass({
    componentDidMount: function() {
        var handle = React.findDOMNode(this);
        handle.addEventListener('mousedown', this.dragStart);
        handle.addEventListener('vmousedown', this.dragStart);
    },
    componentWillUnmount: function() {
        window.removeEventListener('mouseup', this.dragEnd);
        window.removeEventListener('vmouseup', this.dragEnd);
    },
    dragStart: function(e) {
        e.preventDefault();
        this.props.dragStart(e);
    },
    render: function() {
        var handleClasses = classnames({
            'image-comparator-handle': true,
            'image-comparator-handle--draggable': this.props.dragging
        });
        var handleStyle = {
            left: this.props.resizePercentage
        };
        return <span className={handleClasses} style={handleStyle}/>
    }
});


var ImageComparatorLabel = React.createClass({
    render: function() {
        var labelClasses = classnames({
            'image-comparator-label': true,
            'image-comparator-label--visible': this.props.visible,
        });
        return <span className={labelClasses}>
          {this.props.label}
        </span>
    }
});


module.exports = ImageComparator;
