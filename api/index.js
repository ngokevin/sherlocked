/*
    API for Sherlocked.
*/
var fs = require('fs');
var path = require('path');
var url = require('url');

var bodyParser = require('body-parser');
var cors = require('cors');
var express = require('express');
var Promise = require('es6-promise').Promise;

var knex = require('knex')(require('./config'));
var bookshelf = require('bookshelf')(knex);


var app = express();
app.set('bookshelf', bookshelf);
app.use(bodyParser.json({limit: '2mb'}));
app.use(cors());


var BrowserEnv = bookshelf.Model.extend({
    tableName: 'browserEnv',
});


var Capture = bookshelf.Model.extend({
    tableName: 'capture',
    hasTimestamps: ['created_at', 'updated_at'],
    browserEnv: function() {
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


var Build = bookshelf.Model.extend({
    tableName: 'build',
    hasTimestamps: ['created_at', 'updated_at'],
    captures: function() {
        return this.hasMany(Capture, 'buildId');
    },
    masterBuild: function() {
        return this.belongsTo(Build, 'masterBuildId');
    },
    deserialize: function() {
        var root = this;
        function transform(build) {
            // Rework the data structure to group Captures by BrowserEnv
            // alongside the master Build's captures.

            // Create BrowserEnv groups.
            var browserEnvIds = [];
            var groupedCaptures = build.captures.map(function(capture) {
                if (browserEnvIds.indexOf(capture.browserEnv.id) !== -1) {
                    return;
                }
                browserEnvIds.push(capture.browserEnv.id);

                return {
                    browserEnv: capture.browserEnv,
                    captures: {},
                    masterCaptures: {},
                };
            }).filter(function(e) {
                return e;
            });

            // Attach Captures to our groups.
            build.captures.forEach(function(capture) {
                groupedCaptures.forEach(function(groupedCapture) {
                    if (capture.browserEnv.id !=
                        groupedCapture.browserEnv.id) {
                        return;
                    }
                   groupedCapture.captures[capture.name] =
                        deserializeCapture(capture);
                });
            });

            if (!build.masterBuild) {
                build.captures = groupedCaptures;
                return build;
            }

            // Attach master Captures to our groups.
            build.masterBuild.captures.forEach(function(mCapture) {
                groupedCaptures.forEach(function(groupedCapture) {
                    if (mCapture.browserEnv.id !=
                        groupedCapture.browserEnv.id) {
                        return;
                    }
                    groupedCapture.masterCaptures[mCapture.name] =
                        deserializeCapture(mCapture);
                });
            });

            build.captures = groupedCaptures;
            return build;
        }

        return new Promise(function(resolve) {
            root.load(['captures', 'captures.browserEnv', 'masterBuild',
                       'masterBuild.captures',
                       'masterBuild.captures.browserEnv'])
                .then(function(build) {
                    resolve(transform(build.toJSON()));
                });
        });
    }
});


app.get('/api/', function (req, res) {
    res.send('<img src="http://imgur.com/b5jQjd7.png">');
});


app.get('/api/builds/', function(req, res) {
    // List builds.
    Build.query('limit', 25)
         .query('orderBy', 'created_at', 'DESC')
         .fetchAll().then(function(builds) {
        res.send(builds);
    });
});


app.post('/api/builds/', function(req, res) {
    // Get or create a Build, add a Capture to that Build.
    var data = req.body;

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

    buildFound().then(function(build) {
        if (build) {
            // Check if a Build exists.
            return res.sendStatus(409);
        }
        buildCreated().then(function(build) {
            // Create a Build if it doesn't.
            masterBuildFound().then(function(masterBuild) {
                // Attach the current master Build.
                if (masterBuild) {
                    build.set('masterBuildId', masterBuild.id);
                    build.save().then(function() {
                        res.sendStatus(201);
                    });
                } else {
                    res.sendStatus(201);
                }
            });
        });
    });
});


app.get('/api/builds/:buildId', function(req, res) {
    // Get a Build.
    Build.where({travisId: req.params.buildId}).fetch().then(function(build) {
        if (build) {
            build.deserialize().then(function(build) {
                res.send(build);
            });
        } else {
            console.log('No trace at the scene of the crime for Build',
                        req.params.buildId);
            res.sendStatus(404);
        }
    });
});


app.post('/api/builds/:buildId/captures/', function(req, res) {
    // Attach a Capture to a Build.
    var data = req.body;
    var bData = {
        name: data.browserName || '',
        platform: data.browserPlatform || '',
        version: data.browserVersion || '',
    };
    delete data.browserName;
    delete data.browserPlatform;
    delete data.browserVersion;

    function saveCapture() {
        return new Promise(function(resolve, reject) {
            var image = data.image.replace(/^data:image\/png;base64,/, '');
            var imagePath = getCapturePath(data.sauceSessionId);

            fs.writeFile(imagePath, image, 'base64', function(err) {
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
        return new Promise(function(resolve) {
            BrowserEnv.where(bData).fetch().then(function(browserEnv) {
                if (!browserEnv) {
                    BrowserEnv.forge(bData).save().then(function(browserEnv) {
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

    function error() {
        return res.sendStatus(400);
    }

    // Upload capture, get build.
    saveCapture().then(buildFound, error)
        .then(function(build) {
            // Get or create BrowserEnv, create capture.
            browserEnvGetOrCreate().then(captureCreated)
                .then(function(capture) {
                    // Attach Capture to Build.
                    createBuildCapture(build, capture).then(buildFound)
                        .then(function(build) {
                            // Return updated build.
                            res.sendStatus(201);
                        });
                });
        });
});


app.get('/api/captures/:sauceSessionId', function(req, res) {
    res.sendFile(getCapturePath(req.params.sauceSessionId), function(err) {
        if (err) {
            res.sendStatus(err.status);
        }
    });
});


var server = app.listen(process.env.SHERLOCKED_PORT || 1077, function() {
    var url = server.address().address + ':' + server.address().port;
    console.log('"http://' + url + '!", I cried. "Elementary," said he.');
});


module.exports = {
    app: app,
};
