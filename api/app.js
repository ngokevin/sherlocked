/*
    API for Sherlocked.
*/
var bodyParser = require('body-parser');
var express = require('express');
var orm = require('orm');

var app = express();


var models = {
    // Models.
    'Build': ['Build', {
        sauceSessionId: String,
        travisBranch: String,
        travisCommit: String,
        travisId: Number,
        travisRepoSlug: String
    }, {
        methods: {},
        validations: {},
    }]
};


function dbSetup(cb) {
    // Set up database using the models.
    // Creating the database and tables if they don't exist.
    // Register the ORM as Express middleware.
    // Wrapped in a function to assist with test tearDowns.
    app.use(orm.express(process.env.SHERLOCKED_TEST_DB ||
                        'sqlite://db.sqlite', {
        define: function(db, ormModels, next) {
            Object.keys(models).forEach(function(modelKey) {
                ormModels[modelKey] = db.define.apply(db, models[modelKey]);
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
    // Create a build.
    req.models.Build.create([req.body], function(err, items) {
        if (err) {
            console.log(err);
        }
        res.send(items[0]);
    });
});


var server = app.listen(process.env.SHERLOCKED_PORT || 1077, function() {
    var url = server.address().address + ':' + server.address().port;
    console.log('"http://' + url + '!", I cried. "Elementary," said he.');
});


module.exports = {
    app: app,
    dbSetup: dbSetup,
    models: models,
};
