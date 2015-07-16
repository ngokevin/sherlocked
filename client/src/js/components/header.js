import React from 'react';

import Landing from './handlers/landing';


const Header =React.createClass({
  propTypes: {
    title: React.PropTypes.string.isRequired
  },
  render() {
    return <header>
      <h1 className="header-name">
        <a href="/">Sherlocked</a>
      </h1>
      <a className="header-icon" href="/" title="Sherlocked"/>
      <Landing.LandingNav/>
      <h1 className="header-title">{this.props.title}</h1>
    </header>
  }
});
export default Header;
