require('sherlocked')

.investigate('Home Page', function(client) {
    return client
        .url('http://localhost:8000')
        .waitFor('.landing-test-example');
})

.investigate('Home Page on Mobile', function(client) {
    return client
        .setViewportSize({width: 320, height: 960})
        .url('http://localhost:8000');
})

.begin([
    {browserName: 'firefox', platform: 'OS X 10.9'},
    {browserName: 'chrome', platform: 'OS X 10.9'},
    {browserName: 'safari', platform: 'OS X 10.9'}
]);
