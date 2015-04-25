/*
    API for Sherlocked.
*/
var bodyParser = require('body-parser');
var express = require('express');
var orm = require('orm');

var app = express();


app.use(orm.express('sqlite://db.sqlite', {
    define: function(db, models, next) {
        models.Build = db.define('Build', {
            sauceSessionId: String,
            travisBranch: String,
            travisCommit: String,
            travisId: Number,
            travisRepoSlug: String
        }, {
            methods: {},
            validations: {},
        });

        db.sync();
        next();
    }
}));


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
        res.send(items);
    });
});


var server = app.listen(process.env.SHERLOCKED_PORT || 1077, function() {
    var url = server.address().address + ':' + server.address().port;
    console.log('"http://' + url + '!", I cried. "Elementary," said he.');
});
