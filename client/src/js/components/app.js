/*
  Parent-level component that is the immediate descendant of the Redux
  Provider component initialized in main app.js module.
*/
import {Connector} from 'redux/react';
import React from 'react';
import Router from 'react-router';
import urlJoin from 'url-join';

import Header from './header';
import Landing from './handlers/landing';


const App = React.createClass({
  // Smart component, passing down this.context.redux.
  componentDidMount() {
    // Preload placeholder image.
    const placeholderImg = new Image();
    placeholderImg.src = urlJoin(process.env.MEDIA_ROOT,
                                 'img/placeholder.png');
  },
  render() {
    return <Connector select={state => ({pageTypes: state.PageTypes.pageTypes,
                                         title: state.Title.title})}>
      {props => <AppBody {...props}/>}
    </Connector>
  }
});


const AppBody = React.createClass({
  // Dumb component.
  propTypes: {
    pageTypes: React.PropTypes.array.isRequired,
    title: React.PropTypes.string.isRequired,
  },
  render() {
    return <div className="app"
                data-page-types={this.props.pageTypes.join(' ')}>
      <Header title={this.props.title}/>
      <main>
        <Router.RouteHandler dispatch={this.props.dispatch}/>
      </main>
    </div>
  },
});


export default App;
