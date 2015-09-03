import React from 'react';


export default class Header extends React.Component {
  static propTypes = {
    title: React.PropTypes.any.isRequired
  };

  render() {
    return (
      <header>
        <h1 className="header-name">
          <a href="/">Sherlocked</a>
        </h1>
        <a className="header-icon" href="/" title="Sherlocked"/>

        <nav className="landing-nav">
          <ul>
            <li><a href="/builds/">Builds</a></li>
          </ul>
        </nav>

        <h1 className="header-title">
          {this.props.title}
        </h1>
      </header>
    );
  }
}
