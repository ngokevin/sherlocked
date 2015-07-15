/*
    Pub-sub module for allowing components to update the page title.
*/
let title = 'Sherlocked';

let subscribers = [];


function publish(_title) {
  title = _title;
  subscribers.forEach(subscription => subscription(title));
}


function subscribe(subscription) {
  subscribers.push(subscription);
  subscription(title);
}


export default {
  publish: publish,
  subscribe: subscribe,
  title: title,
};
