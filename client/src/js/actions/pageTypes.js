import {createActions} from '../lib/reduxHelpers';


export default createActions({
  setPageTypes(pageTypes) {
    return {pageTypes};
  }
});
