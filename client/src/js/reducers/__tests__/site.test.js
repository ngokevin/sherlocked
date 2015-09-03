import siteReducer from '../site';
import * as siteActions from '../../actions/site';


describe('siteReducer', () => {
  it('sets page types', () => {
    const newState = siteReducer(
      {
        pageTypes: []
      },
      {
        type: siteActions.SET_PAGE_TYPES,
        payload: ['build-detail'],
      }
    )
    assert.deepEqual(newState.pageTypes, ['build-detail']);
  });

  it('sets title', () => {
    const newState = siteReducer(
      {
        title: ''
      },
      {
        type: siteActions.SET_TITLE,
        payload: <p>Title</p>,
      }
    )
    assert.deepEqual(newState.title, <p>Title</p>);
  });
});
