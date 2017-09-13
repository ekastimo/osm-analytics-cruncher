'use strict';
var fs = require('fs');
var turf = require('turf');
var stats = require('simple-statistics');
const utils = require("../oqt-utils/utils");
const getBankName = utils.getBankName;
const getPropsLike = utils.getPropsLike;
const hasAmenity = utils.hasAmenity;
const hasTag = utils.hasTag;
const readCompositeProps = utils.readCompositeProps;
const isMMAgent = utils.isMMAgent;
const isATM = utils.isATM;
const isBank = utils.isBank;



var filter = JSON.parse(fs.readFileSync(global.mapOptions.filterPath));
var fspConfig = filter['fsp'];
if (fspConfig === "qn2") {
    var fspUtils = require(`../fsp-filters/${filter.id}`)
    var _MAX_DISTANCE = fspUtils['max-distance'] || 1000000;
    var mainFeature = fspUtils.main
    var distances = fspUtils.distances
    var compareFeatures = {}
    distances.forEach(function (distance) {
        compareFeatures[distance.name] = require(`../results/json/${distance.name}.json`)
    });
}


// TODO use more educated constant

var users = {};
if (filter.experience.file)
    users = JSON.parse(fs.readFileSync(filter.experience.file));

// Filter features touched by list of users defined by users.json
module.exports = function (tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;
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

    layer.features = layer.features.filter(function (feature) {
        if (filter.composite) {
            return processComposite(feature);
        }
        return feature.geometry.type === filter.geometry && hasTag(feature, filter.tag);
    });

    if (fspConfig && fspConfig === 'qn2') {
        layer.features = layer.features.map(function (feature) {
            if (mainFeature.checker(feature)) {
                distances.forEach((conf) => {
                    const distanceCollection = {};
                    const genDistances = [];
                    const features = compareFeatures[conf.name].features;
                    features.forEach(function (feature2) {
                        const to = (feature2.type === 'Point') ? feature2 : turf.centroid(feature2)
                        const distance = turf.distance(feature, to, "kilometers") * 1000;//Convert to meters
                        genDistances.push(distance);
                        const name = conf.getName(feature2)
                        if (distanceCollection[name]) {
                            distanceCollection[name].push(distance);
                        } else {
                            distanceCollection[name] = [distance];
                        }
                    });
                    feature.properties[conf.propName] = genDistances.length > 0 ? stats.min(genDistances) : _MAX_DISTANCE;
                    for (let name in distanceCollection) {
                        const _distanceArray = distanceCollection[name];
                        feature.properties[`${conf.propNameSurfix}${name}`] = _distanceArray.length > 0 ? stats.min(_distanceArray) : _MAX_DISTANCE;
                    }
                })
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

        if (filter.composite) {
            const extraProps = readCompositeProps(feature, filter);
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