import React from 'react';
import Router from 'react-router';
import urlJoin from 'url-join';

import Landing from './handlers/landing';
import pageTypesStore from '../pageTypesStore';
import titleStore from '../titleStore';


const App = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  getInitialState() {
    return {
      pageTypes: [],
      title: ''
    };
  },
  componentDidMount() {
    titleStore.subscribe(title => {
      this.setState({title: title});
    });
    pageTypesStore.subscribe(pageTypes => {
      this.setState({pageTypes: pageTypes});
    });

    // Preload placeholder image.
    const placeholderImg = new Image();
    placeholderImg.src = urlJoin(process.env.MEDIA_ROOT,
                                 'img/placeholder.png');
  },
  render: function() {
    return <div className="app"
                data-page-types={this.state.pageTypes.join(' ')}>
      <header>
        <h1 className="header-name">
          <a href="/">Sherlocked</a>
        </h1>
        <a className="header-icon" href="/" title="Sherlocked"/>
        <Landing.LandingNav/>
        <h1 className="header-title">{this.state.title}</h1>
      </header>

      <main>
        <Router.RouteHandler/>
      </main>
    </div>
  },
});


export default App;
