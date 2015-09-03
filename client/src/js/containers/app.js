import React from 'react';
import {connect} from 'react-redux';
import urlJoin from 'url-join';

import Header from '../components/header';


export class AppContainer extends React.Component {
  static propTypes = {
    children: React.PropTypes.object,
    pageTypes: React.PropTypes.array,
    title: React.PropTypes.any,
  };

  constructor(props) {
    super(props);

    // Preload placeholder image.
    const placeholderImg = new Image();
    placeholderImg.src = urlJoin(process.env.MEDIA_ROOT,
                                 'img/placeholder.png');
  }

  render() {
    return (
      <div className="app"
           data-page-types={this.props.pageTypes.join(' ')}>
        <Header title={this.props.title}/>

        <main>
          {this.props.children}
        </main>
      </div>
    );
  }
}


export default connect(
  state => ({
    pageTypes: state.site.pageTypes,
    title: state.site.title,
  })
)(AppContainer);
