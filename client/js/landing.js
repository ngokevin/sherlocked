var classnames = require('classnames');
var React = require('react');


var Landing = React.createClass({
    getInitialState: function() {
        return {
            graphicLetterGroups: [
                'I AM'.split(''),
                'SHER'.split(''),
                'LOCKED'.split('')
            ]
        };
    },
    renderGraphicLetter: function(letter, i) {
        var graphicLetterClasses = classnames({
            'landing-graphic-letter': true,
            'landing-graphic-space': letter === ' '
        });
        return <h1 className={graphicLetterClasses}
                   data-graphic-letter-index={i}>
          <span>{letter}</span>
        </h1>
    },
    renderGraphicLetterGroup: function(letters, i) {
        return <div className="landing-graphic-letter-group"
                    data-graphic-letter-group-index={i}>
          {letters.map(this.renderGraphicLetter)}
        </div>
    },
    render: function() {
        return <div className="landing">
          <div className="landing-graphic">
            <div className="landing-graphic-letters">
              {this.state.graphicLetterGroups.map(
               this.renderGraphicLetterGroup)}
            </div>
          </div>
          <div className="landing-info">
            <h2>I am Sherlocked, the world's greatest visual regression testing service.</h2>
            <h3>And it is my business to know what other people don't know.</h3>
          </div>
        </div>
    },
});

module.exports = Landing;
