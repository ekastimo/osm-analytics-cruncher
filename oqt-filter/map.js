'use strict';
var fs = require('fs');

var filter = JSON.parse(fs.readFileSync(global.mapOptions.filterPath));

var users = {};
if (filter.experience.file)
    users = JSON.parse(fs.readFileSync(filter.experience.file));

// Filter features touched by list of users defined by users.json
module.exports = function(tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;

   function hasAmenity(feature, amenity) {
        var resp = feature.properties['amenity'] && feature.properties['amenity'] === amenity;
        return resp;
    }
    // filter
    function hasTag(feature, tag) {
        return feature.properties[tag] && feature.properties[tag] !== 'no';
    }

    layer.features = layer.features.filter(function (feature) {
        if (filter.amenity) {
            return feature.geometry.type === filter.geometry && hasAmenity(feature, filter.amenity);
        }
        return feature.geometry.type === filter.geometry && hasTag(feature, filter.tag);
    });

    // enhance with user experience data
    layer.features.forEach(function(feature) {
        var props = feature.properties;
        var user = props['@uid'];
        feature.properties = {
            _uid : user,
            _timestamp: props['@timestamp']
        };
        feature.properties[filter.tag] = props[filter.tag];
        if (users[user] && users[user][filter.experience.field])
            feature.properties._userExperience = users[user][filter.experience.field]; // todo: include all/generic experience data?
    });

    // output
    if (layer.features.length > 0)
        writeData(JSON.stringify(layer)+'\n');

    done();
};
