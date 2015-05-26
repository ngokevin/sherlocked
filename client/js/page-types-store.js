/*
    Pub-sub module for allowing components to update body page types.
*/
var pageTypes = [];

var subscribers = [];

function publish(_pageTypes) {
    pageTypes = _pageTypes;

    subscribers.forEach(function(subscription) {
        subscription(pageTypes);
    });
}

function subscribe(subscription) {
    subscribers.push(subscription);
    subscription(pageTypes);
}

module.exports = {
    pageTypes: pageTypes,
    publish: publish,
    subscribe: subscribe
};
