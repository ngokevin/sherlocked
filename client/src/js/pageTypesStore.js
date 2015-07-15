/*
    Pub-sub module for allowing components to update body page types.
*/
let pageTypes = [];

let subscribers = [];


function publish(_pageTypes) {
  pageTypes = _pageTypes;
  subscribers.forEach(subscription => subscription(pageTypes));
}


function subscribe(subscription) {
  subscribers.push(subscription);
  subscription(pageTypes);
}


export default {
  publish: publish,
  subscribe: subscribe,
  pageTypes: pageTypes,
};
