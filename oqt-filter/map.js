'use strict';
var fs = require('fs');

var filter = JSON.parse(fs.readFileSync(global.mapOptions.filterPath));

var users = {};
if (filter.experience.file)
    users = JSON.parse(fs.readFileSync(filter.experience.file));

// Filter features touched by list of users defined by users.json
module.exports = function (tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;

    function hasAmenity(feature, amenity) {
        return feature.properties['amenity'] && feature.properties['amenity'] === amenity;
    }
    // filter
    function hasTag(feature, tag) {
        return feature.properties[tag] && feature.properties[tag] !== 'no';
    }

    function processComposite(feature) {
        var tags = filter.tags;
        var hasAnyTag = false;
        tags.forEach(function (tag) {
            hasAnyTag = hasAnyTag || hasTag(feature, tag);
        });

        var amenities = filter.amenities;
        var hasAnyAmenity = false;
        amenities.forEach(function (amenity) {
            hasAnyAmenity = hasAnyAmenity || hasAmenity(feature, amenity);
        });
        return hasAnyTag || hasAnyAmenity;
    }

    function readCompositeProps(feature) {
        var extraProps = {};
        filter.tags.forEach(function (tag) {
            if (hasTag(feature, tag)) {
                extraProps[tag] = feature.properties[tag];
            }
        });

        filter.amenities.forEach(function (amenity) {
            if (hasAmenity(feature, amenity)) {
                extraProps["amenity"] = feature.properties["amenity"];
            }
        });
        return extraProps;
    }

    layer.features = layer.features.filter(function (feature) {
        if (filter.composite) {
            return processComposite(feature);
        }
        return feature.geometry.type === filter.geometry && hasTag(feature, filter.tag);
    });

    // enhance with user experience data
    layer.features.forEach(function (feature) {
        var props = feature.properties;
        var user = props['@uid'];
        var newProps = {
            _uid: user,
            _timestamp: props['@timestamp'],
        };
        if (filter.composite) {
            var extraProps = readCompositeProps(feature);
            Object.assign(newProps, extraProps);
            //console.log(extraProps);
        }
        feature.properties = newProps
        if (users[user] && users[user][filter.experience.field])
            feature.properties._userExperience = users[user][filter.experience.field]; // todo: include all/generic experience data?
    });

    // output
    if (layer.features.length > 0) {
       writeData(JSON.stringify(layer) + '\n');
    }
    done();
};