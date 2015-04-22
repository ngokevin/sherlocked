var environments = [
    {
        browserName: 'firefox',
        platform: 'OS X 10.9'
    },
    {
        browserName: 'firefox',
        version: '18',
        platform: 'OS X 10.9'
    },
    {
        browserName: 'chrome',
        platform: 'OS X 10.9'
    }
];


var captures = [
    function(client) {
        return client.init()
            .setViewportSize({
                width: 320,
                height: 480
            })
            .url('localhost:8675')
            .waitFor('.feed-home');
    }
];


module.exports = {
    captures: captures,
    environments: environments
};
