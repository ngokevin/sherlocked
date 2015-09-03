import * as siteActions from '../actions/site';


const initialState = {
  pageTypes: [],
  title: ''
};


export default function siteReducer(state=initialState, action) {
  switch (action.type) {
    case siteActions.SET_PAGE_TYPES: {
      return Object.assign(state, {
        pageTypes: action.payload
      });
    }

    case siteActions.SET_TITLE: {
      return Object.assign(state, {
        title: action.payload
      });
    }

    default: {
      return state;
    }
  }
}
