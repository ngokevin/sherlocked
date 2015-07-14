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


app.get('/api/builds/', async function(req, res) {
  // List builds.
  const builds = await Build
    .query('limit', 25)
    .query('orderBy', 'created_at', 'DESC')
    .fetchAll();

  if (builds.length) {
    return res.send(builds);
  }
  return res.sendStatus(404);
});


app.get('/api/:user/:repo/builds/', async function(req, res) {
  // List builds for a repo.
  const repoSlug = req.params.user + '/' + req.params.repo;

  const builds = await Build
    .where({travisRepoSlug: repoSlug})
    .query('limit', 25)
    .query('orderBy', 'created_at', 'DESC')
    .fetchAll();

  if (builds.length) {
    return res.send(builds);
  }
  return res.sendStatus(404);
});


app.post('/api/builds/', async function(req, res) {
  // Get or create a Build.
  let data = req.body;

  // Check if Build exists for the Travis ID.
  let build = await Build.where({travisId: data.travisId}).fetch();
  if (build) {
    return res.sendStatus(409);
  }

  // Look for master build.
  const masterBuild = await Build.where({
    travisBranch: 'master',
    travisRepoSlug: data.travisRepoSlug
  }).query('orderBy', 'created_at', 'DESC').fetch();

  // Create a Build if it doesn't yet exist.
  build = await Build.forge(data).save();

  // Attach the current master Build, return.
  if (masterBuild) {
    build.set('masterBuildId', masterBuild.id);
    await build.save();
    res.sendStatus(201);
  } else {
    res.sendStatus(201);
  }
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


app.post('/api/builds/:buildId/done', async function(req, res) {
  // Endpoint for notifying API that Sherlocked build is complete.
  const build = await Build
    .where({travisId: req.params.buildId})
    .fetch();

  if (!build) {
    return res.sendStatus(404);
  }

  const repoSlug = build.get('travisRepoSlug').split('/');
  const githubRes = await github.postBuildIssueComment(
    repoSlug[0], repoSlug[1], build.get('travisPullRequest'),
    build.get('travisId'));

  res.sendStatus(parseInt(githubRes.meta.status.substring(0, 3), 10));
});


app.post('/api/builds/:buildId/captures/', async function(req, res) {
  // Attach a Capture to a Build.
  const data = req.body;

  function saveCaptureImageToDisk(data) {
    return new Promise((resolve, reject) => {
      const image = data.image.replace(/^data:image\/png;base64,/, '');
      const imagePath = getCapturePath(data.sauceSessionId);

      fs.writeFile(imagePath, image, 'base64', err => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        return resolve();
      });
    });
  }

  function browserEnvGetOrCreate(browserEnvData) {
    return new Promise(async function(resolve) {
      let browserEnv = await BrowserEnv
        .where(browserEnvData)
        .fetch();

      if (!browserEnv) {
        browserEnv = await BrowserEnv
          .forge(browserEnvData)
          .save();
      }
      resolve(browserEnv);
    });
  }

  function captureDiffCreate(build, capture) {
    // Run resemblejs on the new capture against the master build.
    const masterBuildId = build.get('masterBuildId');
    if (!masterBuildId) {
      return Promise.resolve();
    }

    return new Promise(async function(resolve, reject) {
      const masterCapture = await Capture
        .where({buildId: masterBuildId, name: capture.get('name')})
        .fetch();

      const masterImgPath = getCapturePath(
        masterCapture.get('sauceSessionId'));
      const modifiedImgPath = getCapturePath(
        capture.get('sauceSessionId'));

      resemble(modifiedImgPath)
        .compareTo(masterImgPath)
        .ignoreAntialiasing()
        .onComplete(diffData => {
          // Write diff image, save CaptureDiff object.
          // SO: writing-buffer-response-from-resemble-js-to-file.
          let buf = new Buffer([]);
          const png = diffData.getDiffImage();
          const strm = png.pack();
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

              const dimDiff = diffData.dimensionDifference;
              CaptureDiff
                .forge({
                  captureId: capture.get('id'),
                  dimensionDifferenceHeight: dimDiff.height,
                  dimensionDifferenceWidth: dimDiff.width,
                  mismatchPercentage: diffData.mismatchPercentage,
                  isSameDimensions: diffData.isSameDimensions,
                })
                .save()
                .then(resolve);
            });
          });
      });
    });
  }

  // Save capture.
  await saveCaptureImageToDisk(data);

  // Get build.
  let build = await Build.where({travisId: req.params.buildId}).fetch();

  // Get or create BrowserEnv.
  const browserEnv = await browserEnvGetOrCreate({
    name: data.browserName || '',
    platform: data.browserPlatform || '',
    version: data.browserVersion || '',
  });

  // Create capture.
  const capture = await Capture.forge({
    browserEnvId: browserEnv.id,
    name: data.name,
    sauceSessionId: data.sauceSessionId,
  }).save();

  // Attach capture to build.
  await capture.set('buildId', build.id).save();

  // Get updated build.
  build = await Build.where({travisId: req.params.buildId}).fetch();

  // Create image diff.
  await captureDiffCreate(build, capture);

  res.sendStatus(201);
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
