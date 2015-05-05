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
    dragEndHandler: function() {
        // Remove the drag handlers once done dragging.
        var el = React.findDOMNode(this);
        while (el) {
            el.removeEventListener('mousemove', this.drag);
            el.removeEventListener('vmousemove', this.drag);
            el = el.parentNode;
        }
    },
    dragHandler: function() {
        // Add drag handler on element and all its ancestor elements.
        var el = React.findDOMNode(this);
        while (el) {
            el.addEventListener('mousemove', this.drag);
            el.addEventListener('vmousemove', this.drag);
            el = el.parentNode;
        }
    },
    drag: function(e) {
        e.preventDefault();
        var root = this;

        var handle = React.findDOMNode(root.refs.handle);
        var handleLeft = handle.getBoundingClientRect().left +
                         document.body.scrollLeft;
        var dragWidth = handle.offsetWidth;
        var xPosition = handleLeft + dragWidth - e.pageX;

        var container = React.findDOMNode(root);
        var containerLeft = container.getBoundingClientRect().left +
                            document.body.scrollLeft;
        var containerWidth = container.offsetWidth;
        var minLeft = containerLeft + 10;
        var maxLeft = containerLeft + containerWidth - dragWidth - 10;

        // Constrain draggable element to within container.
        leftValue = e.pageX + xPosition - dragWidth;
        if (leftValue < minLeft) {
            leftValue = minLeft;
        } else if (leftValue > maxLeft) {
            leftValue = maxLeft;
        }

        var resizePercentage = (leftValue + dragWidth / 2 - containerLeft);
        resizePercentage = resizePercentage * 100 / containerWidth + '%';
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

          <ImageComparatorHandle dragStart={this.dragHandler}
                                 dragEnd={this.dragEndHandler}
                                 left={this.state.resizePercentage}
                                 ref="handle"/>
        </div>
    }
});


var ImageComparatorHandle = React.createClass({
    getInitialState: function() {
        return {
            draggable: false
        };
    },
    componentDidMount: function() {
        var handle = React.findDOMNode(this);
        handle.addEventListener('mousedown', this.dragStart);
        handle.addEventListener('vmousedown', this.dragStart);
        handle.addEventListener('mouseup', this.dragEnd);
        handle.addEventListener('vmouseup', this.dragEnd);
    },
    dragEnd: function() {
        console.log("STOP");
        this.setState({draggable: false});
        this.props.dragEnd();
    },
    dragStart: function(e) {
        console.log("START");
        e.preventDefault();
        this.setState({draggable: true});
        this.props.dragStart();
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
