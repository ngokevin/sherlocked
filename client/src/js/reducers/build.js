import _ from 'lodash';

import * as buildActions from '../actions/build';


const initialState = {
  __persist: true,
  builds: {}
};


export default function buildReducer(state=initialState, action) {
  switch (action.type) {
    case buildActions.FETCH_DETAIL_OK: {
      const newState = _.cloneDeep(state);
      newState.builds[action.payload.travisId] = action.payload;
      return newState;
    }

    case buildActions.FETCH_DETAIL_404: {
      const newState = _.cloneDeep(state);
      newState.builds[action.payload] = {notFound: true};
      return newState;
    }

    case buildActions.FETCH_LIST_OK: {
      const newState = _.cloneDeep(state);

      action.payload.forEach(build => {
        newState.builds[build.travisId] = build;
      });

      return newState;
    }

    default: {
      return state;
    }
  }
}
