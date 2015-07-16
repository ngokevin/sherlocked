import React from 'react';


const Header =React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  propTypes: {
    title: React.PropTypes.string.isRequired
  },
  render() {
    return <header>
      <h1 className="header-name">
        <a href="/">Sherlocked</a>
      </h1>
      <a className="header-icon" href="/" title="Sherlocked"/>

      <nav className="landing-nav">
        <ul>
          <li><Router.Link to="builds">Builds</Router.Link></li>
        </ul>
      </nav>

      <h1 className="header-title">{this.props.title}</h1>
    </header>
  }
});
export default Header;
