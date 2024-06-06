//  Implements "reactive data"!  A pattern seen in all modern JS frameworks
//    For example, when a slider updates, the text input updates too, and vice versa.
//    Adapted from frontendmasters.com/blog/vanilla-javascript-reactivity.
const pubsub = {
  events: {},
  subscribe(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  },
  publish(event, data) {
    if (this.events[event]) this.events[event].forEach(function(callback) { callback(data) });
  }
};

export default pubsub;
