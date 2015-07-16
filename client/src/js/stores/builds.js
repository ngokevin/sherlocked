import _ from 'lodash';

import {createStore, getActionIds} from '../lib/reduxHelpers';
import Actions from '../actions/title';


const actions = getActionIds(Actions);


const initialState = {
  title: 'Sherlocked'
};

export default createStore(initialState, {
  [actions.setTitle]: (state, action) => {
    return _.extend(state, action);
  }
});
