import _ from 'lodash';

import {createStore, getActionIds} from '../lib/reduxHelpers';
import Actions from '../actions/pageTypes';


const actions = getActionIds(Actions);


const initialState = {
  pageTypes: []
};

export default createStore(initialState, {
  [actions.setPageTypes]: (state, action) => {
    state.pageTypes = action.pageTypes;
    return state;
  }
});
