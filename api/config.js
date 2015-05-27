var config = require('./config-local');


module.exports = {
    client: 'sqlite3',
    connection: {
        filename: process.env.SHERLOCKED_TEST_DB || './db.sqlite'
    },
    githubToken: config.githubToken
};
