import buildListReducer from '../buildList';
import * as buildActions from '../../actions/build';


describe('buildListReducer', () => {
  it('sets builds on fetch list', () => {
    const newState = buildListReducer(
      {
        builds: [
          {
            id: 42,
            travisRepoSlug: 'ngokevin/react-router-reverse'
          }
        ],
        notFound: false
      },
      {
        type: buildActions.FETCH_LIST_OK,
        payload: [
          {
            id: 5,
            travisRepoSlug: 'ngokevin/ngokevin'
          }
        ]
      },
    );
    assert.deepEqual(newState, {
      builds: [
        {
          id: 5,
          travisRepoSlug: 'ngokevin/ngokevin'
        }
      ],
      notFound: false
    });
  });

  it('marks notFound if 404', () => {
    const newState = buildListReducer(
      {
        builds: [
          {
            id: 42,
            travisRepoSlug: 'ngokevin/react-router-reverse'
          }
        ],
        notFound: false
      },
      {
        type: buildActions.FETCH_LIST_404,
      },
    );
    assert.deepEqual(newState, {
      builds: [],
      notFound: true
    });
  });
});
