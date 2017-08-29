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
    var bankATMData = require('../banks-atms-data.json');
    var selectedBanks = require('../banks-atms-list.json');
}

const _MAX_DISTANCE = filter['MAX_DISTANCE'] || 1000000;// TODO use more educated constant
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
        // Compute Distance using features in the same tile.
        layer.features = layer.features.map(function (feature) {
            if (isMMAgent(feature)) {
                var distBanks = [];
                var distATMs = [];
                var bankCollection = {};
                var atmCollection = {};
                bankATMData.forEach(function (feature2) {
                    const to = (feature2.type === 'Point') ? feature2 : turf.centroid(feature2)
                    if (isBank(feature2)) {
                        const distance = turf.distance(feature, to, "kilometers");
                        const _distance = distance * 1000;//Convert to meters
                        distBanks.push(_distance);
                        const rawName = feature2.properties._name;
                        const bankName = rawName ? getBankName(rawName, selectedBanks) : 'unknown';
                        if (bankCollection[bankName]) {
                            bankCollection[bankName].push(_distance);
                        } else {
                            bankCollection[bankName] = [_distance];
                        }
                    } else if (isATM(feature2)) {
                        const distance = turf.distance(feature, to, "kilometers");
                        const _distance = distance * 1000;//Convert to meters
                        distATMs.push(_distance);
                        const rawName = feature2.properties._name;
                        const atmName = rawName ? getBankName(rawName, selectedBanks) : 'unknown';
                        if (atmCollection[atmName]) {
                            atmCollection[atmName].push(_distance);
                        } else {
                            atmCollection[atmName] = [_distance];
                        }
                    }
                });
                feature.properties._distanceFromBank = distBanks.length > 0 ? stats.min(distBanks) : _MAX_DISTANCE;
                feature.properties._distanceFromATM = distATMs.length > 0 ? stats.min(distATMs) : _MAX_DISTANCE;
                for (let bank in bankCollection) {
                    const distances = bankCollection[bank];
                    feature.properties[`_bank_${bank}`] = distances.length > 0 ? stats.min(distances) : _MAX_DISTANCE;
                }
                for (let atm in atmCollection) {
                    const distances = atmCollection[atm];
                    feature.properties[`_atm_${atm}`] = distances.length > 0 ? stats.min(distances) : _MAX_DISTANCE;
                }
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