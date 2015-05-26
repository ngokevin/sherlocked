var Github = require('github');


var github = new Github({
    version: '3.0.0',
    protocol: 'https',
    host: 'api.github.com',
    timeout: 5000,
    headers: {
        'user-agent': 'Sherlocked'
    }
});


function postBuildIssueComment(user, repo, num, build) {
}


module.exports = {
    postBuildIssueComment: postBuildIssueComment
};
