/*
  API for Sherlocked.
*/
import fs from 'fs';
import path from 'path';
import url from 'url';

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import resemble from 'node-resemble-js';

import github from './github';


const knex = require('knex')(require('./config'));
const bookshelf = require('bookshelf')(knex);


const app = express();
app.set('bookshelf', bookshelf);
app.use(bodyParser.json({limit: '2mb'}));
app.use(cors());


const BrowserEnv = bookshelf.Model.extend({
  tableName: 'browserEnv',
});


const Capture = bookshelf.Model.extend({
  tableName: 'capture',
  hasTimestamps: ['created_at', 'updated_at'],
  browserEnv() {
    return this.belongsTo(BrowserEnv, 'browserEnvId');
  }
});


function getCapturePath(sauceSessionId) {
  return path.resolve('./captures/', sauceSessionId + '.png');
}


function deserializeCapture(capture) {
  capture.src = url.resolve('/api/captures/', capture.sauceSessionId);
  return capture;
}


const CaptureDiff = bookshelf.Model.extend({
  tableName: 'captureDiff',
  browserEnv() {
    return this.belongsTo(Capture, 'captureId');
  }
});


function getCaptureDiffPath(sauceSessionId) {
  return path.resolve('./captures/', sauceSessionId + '-diff.png');
}


const Build = bookshelf.Model.extend({
  tableName: 'build',
  hasTimestamps: ['created_at', 'updated_at'],
  captures() {
    return this.hasMany(Capture, 'buildId');
  },
  masterBuild() {
    return this.belongsTo(Build, 'masterBuildId');
  },
  deserialize() {
    const root = this;

    function transform(build) {
      // Rework the data structure to group Captures by BrowserEnv
      // alongside the master Build's captures.

      // Create BrowserEnv groups.
      let browserEnvIds = [];
      let groupedCaptures = build.captures.map(capture => {
        if (browserEnvIds.indexOf(capture.browserEnv.id) !== -1) {
          return;
        }
        browserEnvIds.push(capture.browserEnv.id);

        return {
          browserEnv: capture.browserEnv,
          captures: {},
          masterCaptures: {},
        };
      }).filter(e => e);

      // Attach Captures to our groups.
      build.captures.forEach(capture => {
        groupedCaptures.forEach(groupedCapture => {
          if (capture.browserEnv.id !=
            groupedCapture.browserEnv.id) {
            return;
          }
           groupedCapture.captures[capture.name] = deserializeCapture(capture);
        });
      });

      if (!build.masterBuild) {
        build.captures = groupedCaptures;
        return build;
      }

      // Attach master Captures to our groups.
      build.masterBuild.captures.forEach(mCapture => {
        groupedCaptures.forEach(groupedCapture => {
          if (mCapture.browserEnv.id != groupedCapture.browserEnv.id) {
            return;
          }
          groupedCapture.masterCaptures[mCapture.name] =
            deserializeCapture(mCapture);;
        });
      });

      build.captures = groupedCaptures;
      return build;
    }

    return new Promise(resolve => {
      root.load(['captures', 'captures.browserEnv', 'masterBuild',
                 'masterBuild.captures', 'masterBuild.captures.browserEnv'])
      .then(build => {
        resolve(transform(build.toJSON()));
      });
    });
  }
});


app.get('/api/', (req, res) => {
  res.send('<img src="http://imgur.com/b5jQjd7.png">');
});


app.get('/api/builds/', (req, res) => {
  // List builds.
  Build
    .query('limit', 25)
    .query('orderBy', 'created_at', 'DESC')
    .fetchAll().then(builds => {
      if (builds.length) {
        res.send(builds);
      } else {
        res.sendStatus(404);
      }
    });
});


app.get('/api/:user/:repo/builds/', (req, res) => {
  // List builds for a repo.
  const repoSlug = req.params.user + '/' + req.params.repo;

  Build
    .where({travisRepoSlug: repoSlug})
    .query('limit', 25)
    .query('orderBy', 'created_at', 'DESC')
    .fetchAll().then(builds => {
      if (builds.length) {
        res.send(builds);
      } else {
        res.sendStatus(404);
      }
    });
});


app.post('/api/builds/', (req, res) => {
  // Get or create a Build, add a Capture to that Build.
  let data = req.body;

  function buildFound() {
    return Build.where({travisId: data.travisId}).fetch();
  }

  function buildCreated() {
    return Build.forge(data).save();
  }

  function masterBuildFound() {
    return Build.where({
      travisBranch: 'master',
      travisRepoSlug: data.travisRepoSlug
    }).query('orderBy', 'created_at', 'DESC').fetch();
  }

  buildFound().then(build => {
    if (build) {
      // Check if a Build exists.
      return res.sendStatus(409);
    }
    masterBuildFound().then(masterBuild => {
      // Create a Build if it doesn't.
      buildCreated().then(build => {
        // Attach the current master Build.
        if (masterBuild) {
          build.set('masterBuildId', masterBuild.id);
          build.save().then(() => {
            res.sendStatus(201);
          });
        } else {
          res.sendStatus(201);
        }
      });
    });
  });
});


app.get('/api/builds/:buildId', (req, res) => {
  // Get a Build.
  Build.where({travisId: req.params.buildId}).fetch().then(build => {
    if (build) {
      build.deserialize().then(build => {
        res.send(build);
      });
    } else {
      console.log('No trace at the scene of the crime for Build',
                  req.params.buildId);
      res.sendStatus(404);
    }
  });
});


app.post('/api/builds/:buildId/done', (req, res) => {
  // Endpoint for notifying API that Sherlocked build is complete.
  Build
    .where({travisId: req.params.buildId})
    .fetch()
    .then(build => {
      if (!build) {
        return;
      }
      const repoSlug = build.get('travisRepoSlug').split('/');
      github.postBuildIssueComment(repoSlug[0], repoSlug[1],
                     build.get('travisPullRequest'),
                     build.get('travisId'))
        .then(githubRes => {
          res.sendStatus(
            parseInt(githubRes.meta.status.substring(0, 3), 10));
        });
    });
});


app.post('/api/builds/:buildId/captures/', (req, res) => {
  // Attach a Capture to a Build.
  let data = req.body;
  let bData = {
    name: data.browserName || '',
    platform: data.browserPlatform || '',
    version: data.browserVersion || '',
  };
  delete data.browserName;
  delete data.browserPlatform;
  delete data.browserVersion;

  function saveCapture() {
    return new Promise((resolve, reject) => {
      const image = data.image.replace(/^data:image\/png;base64,/, '');
      const imagePath = getCapturePath(data.sauceSessionId);

      fs.writeFile(imagePath, image, 'base64', err => {
        delete data.image;

        if (err) {
          console.log(err);
          return reject(err);
        }
        return resolve();
      });
    });
  }

  function buildFound() {
    return Build.where({travisId: req.params.buildId}).fetch();
  }

  function browserEnvGetOrCreate() {
    return new Promise(resolve => {
      BrowserEnv.where(bData).fetch().then(browserEnv => {
        if (!browserEnv) {
          BrowserEnv.forge(bData).save().then(browserEnv => {
            data.browserEnvId = browserEnv.id;
            resolve();
          });
        } else {
          data.browserEnvId = browserEnv.id;
          resolve();
        }
      });
    });
  }

  function captureCreated() {
    return Capture.forge(data).save();
  }

  function createBuildCapture(build, capture) {
    return capture.set('buildId', build.id).save();
  }

  function imageDiffCreated(build, capture) {
    // Run resemblejs on the new capture against the master build.
    const masterBuildId = build.get('masterBuildId');
    if (!masterBuildId) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      Capture.where({buildId: masterBuildId, name: capture.get('name')})
           .fetch().then(originalCapture => {
        const originalImgPath = getCapturePath(
          originalCapture.get('sauceSessionId'));
        const modifiedImgPath = getCapturePath(
          capture.get('sauceSessionId'));

        resemble(modifiedImgPath)
          .compareTo(originalImgPath)
          .ignoreAntialiasing()
          .onComplete(diffData => {
            // Write diff image, save CaptureDiff object.
            // SO: writing-buffer-response-from-resemble-js-to-file.
            let buf = new Buffer([]);
            const png = diffData.getDiffImage();
            const strm = png.pack()
            strm.on('data', data => {
              buf = Buffer.concat([buf, data])
            });
            strm.on('end', () => {
              const dest = getCaptureDiffPath(capture.get('sauceSessionId'));
              fs.writeFile(dest, buf, null, err => {
                if (err) {
                  console.log(err);
                  return reject(err);
                }
                CaptureDiff.forge({
                  captureId: capture.get('id'),
                  dimensionDifferenceHeight: diffData.dimensionDifference.height,
                  dimensionDifferenceWidth: diffData.dimensionDifference.width,
                  mismatchPercentage: diffData.mismatchPercentage,
                  isSameDimensions: diffData.isSameDimensions,
                  sauceSessionId: capture.get('sauceSessionId'),
                }).save().then(resolve);
              });
            });
          });
      });
    });
  }

  function error() {
    return res.sendStatus(400);
  }

  // Upload capture, get build.
  saveCapture().then(buildFound, error)
    .then(build => {
      // Get or create BrowserEnv, create capture.
      browserEnvGetOrCreate().then(captureCreated)
        .then(capture => {
          // Attach Capture to Build.
          createBuildCapture(build, capture).then(buildFound)
            .then(build => {
              // Return updated build.
              imageDiffCreated(build, capture).then(() => {
                res.sendStatus(201);
              });
            });
        });
    });
});


app.get('/api/captures/:sauceSessionId', (req, res) => {
  res.sendFile(getCapturePath(req.params.sauceSessionId), err => {
    if (err) {
      res.sendStatus(err.status);
    }
  });
});


const server = app.listen(process.env.SHERLOCKED_PORT || 1077, () => {
  const url = server.address().address + ':' + server.address().port;
  console.log('"http://' + url + '!", I cried. "Elementary," said he.');
});


module.exports = {
  app: app,
};
