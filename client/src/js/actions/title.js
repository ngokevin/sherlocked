import {createActions} from '../lib/reduxHelpers';


export default createActions({
  setTitle(title) {
    return {title};
  }
});
