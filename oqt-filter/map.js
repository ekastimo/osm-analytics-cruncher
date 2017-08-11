'use strict';
var fs = require('fs');
var turf = require('turf');
var stats = require('simple-statistics');

var filter = JSON.parse(fs.readFileSync(global.mapOptions.filterPath));
var fspConfig = filter['fsp'];
if (fspConfig === "qn2")
    var bankATMData = require('../banks-atms-data.json');
const _MAX_DISTANCE = filter['MAX_DISTANCE'] || 200000;// TODO use more educated constant
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
    function isBank(feature) {
        return hasAmenity(feature, 'bank');
    }
    function isATM(feature) {
        return hasAmenity(feature, 'atm');
    }
    function isMMAgent(feature) {
        return hasAmenity(feature, 'mobile_money_agent');
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

    if (fspConfig && fspConfig === 'qn2') {
        // Compute Distance using features in the same tile.
        layer.features = layer.features.map(function (feature) {
            if (isMMAgent(feature)) {
                var distBanks = [];
                var distATMs = [];
                bankATMData.forEach(function (feature2) {
                    const to = (feature2.type === 'Point') ? feature2 : turf.centroid(feature2)
                    if (isBank(feature2)) {
                        const distance = turf.distance(feature, to, "kilometers");
                        distBanks.push(distance * 1000);
                    } else if (isATM(feature2)) {
                        const distance = turf.distance(feature, to, "kilometers");
                        distATMs.push(distance * 1000);
                    }
                });
                feature.properties._distanceFromBank = distBanks.length > 0 ? stats.min(distBanks) : _MAX_DISTANCE;
                feature.properties._distanceFromATM = distATMs.length > 0 ? stats.min(distATMs) : _MAX_DISTANCE;
            }
            return feature;
        });
    }

    // enhance with user experience data
    layer.features.forEach(function (feature) {
        var props = feature.properties;
        var user = props['@uid'];
        var newProps = {
            _uid: user,
            _timestamp: props['@timestamp'],
            _name: props['name'],
        };
        if (fspConfig && fspConfig === 'qn2') {
            if (props['_distanceFromBank'])
                newProps['_distanceFromBank'] = props['_distanceFromBank'];
            if (props['_distanceFromATM'])
                newProps['_distanceFromATM'] = props['_distanceFromATM'];
        }
        if (filter.composite) {
            var extraProps = readCompositeProps(feature);
            Object.assign(newProps, extraProps);
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