module.exports = [{
    pattern: 'http://localhost:1077/api/(.*)',
    fixtures: function(match, params) {
        return {};
    },
    callback: function (match, data) {
        return {
            body: {}
        };
    }
}];
