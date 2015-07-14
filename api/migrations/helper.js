// Helper for database connection.
module.exports = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: process.env.SHERLOCKED_TEST_DB || './db.sqlite'
    },
});
