/*
    Pub-sub module for allowing components to update the page title.
*/
var title = 'Sherlocked';

var subscribers = [];

function publish(_title) {
    title = _title;

    subscribers.forEach(function(subscription) {
        subscription(title);
    });
}

function subscribe(subscription) {
    subscribers.push(subscription);
    subscription(title);
}

module.exports = {
    title: title,
    publish: publish,
    subscribe: subscribe
};
