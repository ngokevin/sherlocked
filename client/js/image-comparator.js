var classnames = require('classnames');
var React = require('react');


var ImageComparator = React.createClass({
    getInitialState: function() {
        return {
            originalLabelVisible: false,
            resizeLabelVisible: true,
            resizePercentage: '100%',
            animated: false
        };
    },
    animateIfVisible: function() {
        // Check until comparator is in the viewport to animate it.
        var root = this;
        var comparator = React.findDOMNode(root);
        var comparatorTop = comparator.getBoundingClientRect().top +
                            document.body.scrollTop;

        var viewportHalf = -1 * document.body.getBoundingClientRect().top +
                           document.body.offsetHeight * 0.5;
        if (viewportHalf > comparatorTop) {
            root.setState({animated: true});
        }
    },
    componentDidMount: function() {
        window.addEventListener('resize', this.updateHandleVisibility);
        window.addEventListener('scroll', this.animateIfVisible);
        this.animateIfVisible();
    },
    componentWillUnmount: function() {
        window.removeEventListener('resize', this.updateHandleVisibility);
        window.removeEventListener('scroll', this.animateIfVisible);
    },
    dragEndHandler: function(e) {
        // Remove the drag handlers once done dragging.
        var el = React.findDOMNode(this);
        while (el) {
            el.removeEventListener('mousemove', this.drag);
            el.removeEventListener('vmousemove', this.drag);
            el = el.parentNode;
        }
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
            handleXPos: handleLeft + handleWidth - e.pageX,
            handleXPosMin: comparatorLeft + 10,
            handleXPosMax: comparatorLeft + comparatorWidth - handleWidth - 10,
            handleWidth: handleWidth
        });

        while (el) {
            el.addEventListener('mousemove', root.dragMoveHandler);
            el.addEventListener('vmousemove', root.dragMoveHandler);
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
    updateLabelVisibility: function() {
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
    },
    render: function() {
        var comparatorClasses = classnames({
            'image-comparator': true,
            'image-comparator--animated': this.state.animated
        });
        var resizeStyle = {
            width: this.state.resizePercentage
        };

        return <div className={comparatorClasses}>
          <img className="image-comparator-img"
               src={this.props.originalSrc}/>
          <ImageComparatorLabel label="Original" position="left"
                                ref="originalLabel"/>

          <div className="image-comparator-resize" ref="resizeEl"
               style={resizeStyle}>
            <img className="image-comparator-img"
                 src={this.props.modifiedSrc}/>
            <ImageComparatorLabel label="Modified" position="right"
                                  ref="resizeLabel"/>
          </div>

          <ImageComparatorHandle dragStart={this.dragStartHandler}
                                 dragEnd={this.dragEndHandler}
                                 resizePercentage={this.state.resizePercentage}
                                 ref="handle"/>
        </div>
    }
});


var ImageComparatorHandle = React.createClass({
    getInitialState: function() {
        return {
            draggable: false,
            resizePercentage: '100%'
        };
    },
    componentDidMount: function() {
        var handle = React.findDOMNode(this);
        handle.addEventListener('mousedown', this.dragStart);
        handle.addEventListener('vmousedown', this.dragStart);
        window.addEventListener('mouseup', this.dragEnd);
        window.addEventListener('vmouseup', this.dragEnd);
    },
    componentWillUnmount: function() {
        window.removeEventListener('mouseup', this.dragEnd);
        window.removeEventListener('vmouseup', this.dragEnd);
    },
    dragEnd: function(e) {
        if (this.state.draggable) {
            this.setState({draggable: false});
            this.props.dragEnd(e);
        }
    },
    dragStart: function(e) {
        e.preventDefault();
        this.setState({draggable: true});
        this.props.dragStart(e);
    },
    render: function() {
        var handleClasses = classnames({
            'image-comparator-handle': true,
            'image-comparator-handle--draggable': this.state.draggable
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
