var environments = [
    {
        browserName: 'firefox',
        version: '30',
        platform: 'OS X 10.9'
    },
    {
        browserName: 'firefox',
        version: '32',
        platform: 'OS X 10.9'
    },
    {
        browserName: 'firefox',
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
            .waitFor('#splash-overlay.hide');
    }
];


module.exports = {
    captures: captures,
    environments: environments
};
