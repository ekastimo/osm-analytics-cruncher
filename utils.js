var queue = require('queue-async');
function hasAmenity(feature, amenity) {
    return feature.properties['amenity'] && feature.properties['amenity'] === amenity;
}
// filter
function hasTag(feature, tag) {
    return feature.properties[tag] && feature.properties[tag] !== 'no';
}


function delayedHello(callback) {
  setTimeout(function() {
    console.log("Hello!");
    callback(null);
  }, 1000);
}

var q = queue();
q.defer(delayedHello);
q.defer(delayedHello);
q.await(function(error) {
  if (error) throw error;
  console.log("Goodbye!");
});