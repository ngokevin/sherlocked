import _ from 'lodash';

import * as buildActions from '../actions/build';


const initialState = {
  __persist: true,
  builds: [],
  notFound: false
};


export default function buildListReducer(state=initialState, action) {
  switch (action.type) {
    case buildActions.FETCH_LIST_OK: {
      const newState = _.cloneDeep(state);
      newState.builds = action.payload;
      newState.notFound = false;
      return newState;
    }

    case buildActions.FETCH_LIST_404: {
      return {
        builds: [],
        notFound: true
      };
    }

    default: {
      return state;
    }
  }
}
