import {createAction} from 'redux-actions'
import req from 'request';
import urlJoin from 'url-join';


export const FETCH_DETAIL_OK = 'BUILD__FETCH_DETAIL_OK';
const fetchDetailOk = createAction(FETCH_DETAIL_OK);

export const FETCH_DETAIL_404 = 'BUILD__FETCH_DETAIL_404';
const fetchDetail404 = createAction(FETCH_DETAIL_404);

export const FETCH_LIST_OK = 'BUILD__FETCH_LIST_OK';
const fetchListOk = createAction(FETCH_LIST_OK);

export const FETCH_LIST_404 = 'BUILD__FETCH_LIST_404';
const fetchList404 = createAction(FETCH_LIST_404);


export function fetchDetail(buildId) {
  return (dispatch, getState) => {
    req
      .get(urlJoin(process.env.API_ROOT, 'builds', buildId))
      .then(res => {
        dispatch(fetchDetailOk(res.body));
      }, err => {
        if (err.status === 404) {
          dispatch(fetchDetail404(buildId));
        }
      });
  };
};


export function fetchList(user, repo) {
  let listRoute;
  if (user && repo) {
    listRoute = urlJoin(process.env.API_ROOT, user, repo, 'builds/');
  } else {
    listRoute = urlJoin(process.env.API_ROOT, 'builds/');
  }

  return (dispatch, getState) => {
    req
      .get(listRoute)
      .then(res => {
        dispatch(fetchListOk(res.body));
      }, err => {
        if (err.status === 404) {
          dispatch(fetchList404());
        }
      });
  };
}
