/*
    API for Sherlocked.
*/
var bodyParser = require('body-parser');
var express = require('express');
var orm = require('orm');
var Promise = require('es6-promise').Promise;

var app = express();


function dbSetup(cb) {
    // Set up database using the models.
    // Creating the database and tables if they don't exist.
    // Register the ORM as Express middleware.
    // Wrapped in a function to assist with test tearDowns.
    app.use(orm.express(process.env.SHERLOCKED_TEST_DB ||
                        'sqlite://db.sqlite', {
        define: function(db, models, next) {
            // A Sherlocked test build containing all Captures.
            models.Build = db.define('build', {
                travisId: Number,
                travisRepoSlug: String,
                travisPullRequest: Number
            }, {
                methods: {},
                validations: {},
            });

            // A Capture (i.e., screenshot).
            models.Capture = db.define('captures', {
                name: String,
                sauceSessionId: String
            });

            // A Build can have many Captures.
            models.Build.hasMany('captures', {}, {
                autoFetch: true
            });

            db.sync(function() {
                next();
                if (cb) {
                    cb();
                }
            });
        }
    }));
}
dbSetup();


app.use(bodyParser.json());


app.get('/', function (req, res) {
    res.send('<img src="http://imgur.com/b5jQjd7.png">');
});


app.get('/builds/', function(req, res) {
    // List builds.
    req.models.Build.find(function(err, items) {
        if (err) {
            console.log(err);
        }
        res.send(items);
    });
});


app.post('/builds/', function(req, res) {
    // Get or create a Build, add a Capture to that Build.
    req.models.Build.find({travisId: req.body.travisId}, function(err, items) {
        if (err) {
            console.log(err);
        }

        if (!items.length) {
            // Build doesn't exist, create Build.
            req.models.Build.create([req.body], function(err, items) {
                if (err) {
                    console.log(err);
                }
                res.send(items[0]);
            });
        }
    });
});


app.get('/builds/:buildId', function(req, res) {
    // Get a Build.
    req.models.Build.find(req.param.buildId, function(err, items) {
        if (err) {
            console.log(err);
        }
        res.send(items[0]);
    });
});


app.post('/builds/:buildId/captures/', function(req, res) {
    // Attach a Capture to a Build.
    function buildFound() {
        return new Promise(function(resolve) {
            req.models.Build.find(req.param.buildId, function(err, builds) {
                // Get the Build.
                if (err) {
                    console.log(err);
                }
                resolve(builds[0]);
            });
        });
    }

    function captureCreated() {
        return new Promise(function(resolve) {
            req.models.Capture.create([req.body], function(err, captures) {
                if (err) {
                    console.log(err);
                }
                resolve(captures[0]);
            });
        });
    }

    function createBuildCapture(build, capture) {
        return new Promise(function(resolve) {
            build.addCaptures([capture], function(err) {
                if (err) {
                    console.log(err);
                }
                resolve();
            });
        });
    }

    // Get Build, create Capture, attach Capture to Build, return updated
    // Build object with the Captures.
    buildFound().then(function(build) {
        captureCreated().then(function(capture) {
            createBuildCapture(build, capture).then(function() {
                buildFound().then(function(build) {
                    console.log(build.captures);
                    res.send(build);
                });
            });
        });
    });
});


var server = app.listen(process.env.SHERLOCKED_PORT || 1077, function() {
    var url = server.address().address + ':' + server.address().port;
    console.log('"http://' + url + '!", I cried. "Elementary," said he.');
});


module.exports = {
    app: app,
    dbSetup: dbSetup,
};
