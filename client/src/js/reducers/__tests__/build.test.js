import buildReducer from '../build';
import * as buildActions from '../../actions/build';


describe('buildReducer', () => {
  it('stores single build on fetch detail', () => {
    const newState = buildReducer(
      {
        builds: {}
      },
      {
        type: buildActions.FETCH_DETAIL_OK,
        payload: {
          id: 5,
          travisId: 50,
          travisRepoSlug: 'ngokevin/ngokevin'
        }
      },
    );
    assert.deepEqual(newState, {
      builds: {
        '50': {
          id: 5,
          travisId: 50,
          travisRepoSlug: 'ngokevin/ngokevin'
        }
      }
    });
  });

  it('stores multiple builds on fetch list', () => {
    const newState = buildReducer(
      {
        builds: {}
      },
      {
        type: buildActions.FETCH_LIST_OK,
        payload: [
          {
            id: 5,
            travisId: 50,
            travisRepoSlug: 'ngokevin/ngokevin'
          },
          {
            id: 10,
            travisId: 100,
            travisRepoSlug: 'ngokevin/sherlocked'
          },
        ]
      },
    );
    assert.deepEqual(newState, {
      builds: {
        '50': {
          id: 5,
          travisId: 50,
          travisRepoSlug: 'ngokevin/ngokevin'
        },
        '100': {
          id: 10,
          travisId: 100,
          travisRepoSlug: 'ngokevin/sherlocked'
        }
      }
    });
  });

  it('marks build as notFound if 404', () => {
    const newState = buildReducer(
      {
        builds: {}
      },
      {
        type: buildActions.FETCH_DETAIL_404,
        payload: 50
      },
    );
    assert.deepEqual(newState, {
      builds: {
        '50': {
          notFound: true
        }
      }
    });
  });
});
