import React from 'react';
import {reverse} from 'react-router-reverse';


export default class Search extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    };
  }

  handleChange = e => {
    this.setState({
      value: e.target.value
    });
  }

  search = e => {
    e.preventDefault();
    const router = this.context.router;

    if (this.state.value.match(/^\w+\/\w+$/)) {
      // Filter by repoSlug.
      const val = this.state.value.split('/');
      router.transitionTo(
        reverse(router.routes, 'build-list-by-repo', {
          user: val[0],
          repo: val[1]
        })
      );

    } else if (this.state.value.match(/^\d+$/)) {
      // Transition directly to build detail.
      router.transitionTo(
        reverse(router.routes, 'build', {
          buildId: this.state.value
        })
      );
    }

    else if (!this.state.value) {
      // Reset.
      router.transitionTo(
        reverse(router.routes, 'build-list')
      );
    }
  }

  render() {
    return (
      <div className="search">
        <form onSubmit={this.search}>
          <input name="search"
                 onChange={this.handleChange}
                 placeholder="Search a Github user/repo or Travis #..."
                 value={this.state.value}/>
        </form>
      </div>
    );
  }
}
