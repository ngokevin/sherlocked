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
    checkPosition: function() {
        // Check until comparator is in the viewport to animate it.
        var root = this;
        var comparator = React.findDOMNode(root);
        var comparatorTop = comparator.getBoundingClientRect().top +
                            document.body.scrollTop;
        if (window.scrollTop + window.offsetHeight * 0.5 > comparatorTop) {
            root.setState({animated: true});
        }
    },
    componentDidMount: function() {
        window.addEventListener('resize', this.updateHandleVisibility);
        window.addEventListener('scroll', this.checkPosition);
    },
    componentWillUnmount: function() {
        window.removeEventListener('resize', this.updateHandleVisibility);
        window.removeEventListener('scroll', this.checkPosition);
    },
    dragEndHandler: function() {
        // Remove the drag handlers once done dragging.
        var el = this;
        while (el) {
            el.removeEventListener('mousemove vmousemove', this.drag);
            el = el.parentNode;
        }
        this.removeEventListener('mousemove vmousemove', this.drag);
    },
    dragHandler: function() {
        // Add drag handler on element and all its ancestor elements.
        var el = this;
        while (el) {
            el.addEventListener('mousemove vmousemove', this.drag);
            el = el.parentNode;
        }
        this.addEventListener('mousemove vmousemove', this.drag);
    },
    drag: function(e) {
        e.preventDefault();
        var root = this;

        var handle = this.refs.handle;
        var handleLeft = handle.getBoundingClientRect().left +
                         document.body.scrollLeft;
        var dragWidth = handle.offsetWidth;
        var xPosition = handleLeft + dragWidth - e.pageX;

        var containerLeft = root.getBoundingClientRect().left +
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

        var resizePercentage = (leftValue + dragWidth / 2 - containerOffset);
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
            if (label.props.position == 'left') {
                root.setState({
                    originalLabelVisible: labelLeft + label.offsetWidth <
                                           resizeRight
                });
            } else if (this.props.position == 'right') {
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
                                refs="originalLabel"/>

          <div className="image-comparator-resize" refs="resizeEl"
               style={resizeStyle}>
            <img className="image-comparator-img"
                 src={this.props.modifiedSrc}/>
            <ImageComparatorLabel label="Modified" position="right"
                                  refs="resizeLabel"/>
          </div>

          <ImageComparatorHandle dragStart={this.dragHandler}
                                 dragEnd={this.dragEndHandler}
                                 left={this.state.resizePercentage}
                                 refs="handle"/>
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
        handle.addEventListener('mousedown vmousedown', this.dragStart);
        handle.addEventListener('mouseup vmouseup', this.dragEnd);
    },
    componentWillUnmount: function() {
        var handle = React.findDOMNode(this);
        handle.removeEventListener('mousedown vmousedown', this.dragStart);
        handle.removeEventListener('mouseup vmouseup', this.dragEnd);
    },
    dragEnd: function() {
        this.setState({draggable: false});
        this.props.dragEnd();
    },
    dragStart: function(e) {
        e.preventDefault();
        this.setState({draggable: true});
        this.props.dragStart();
    },
    render: function() {
        var handleClasses = {
            'image-comparator-handle': true,
            'image-comparator-handle--draggable': this.state.draggable
        };
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
