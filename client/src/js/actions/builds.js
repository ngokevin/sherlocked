import {createActions} from '../lib/reduxHelpers';
import req from '../request';
import urlJoin from 'url-join';


export default createActions({
  fetchBuild(buildId) {
    return new Promise((resolve, reject) => {
      req
        .get(urlJoin(process.env.API_ROOT, 'builds', buildId))
        .then(res => {
          resolve(res.body);
        });
    });
  },
  fetchList() {
  }
});
