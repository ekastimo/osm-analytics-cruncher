'use strict';
var turf = require('turf');
var fs = require('fs');
var utils = require('../oqt-utils/utils');


var config = global.mapOptions.config
var filters = {};
config.forEach(function (filter) {
    filters[filter.name] = JSON.parse(fs.readFileSync(`./filters-osm/${filter.name}.json`));
});

// Filter features touched by list of users defined by users.json
module.exports = function (tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;
    var users = {};
    layer.features.forEach(function (val) {
        var user = val.properties['@uid'];
        if (!users[user]) {
            const obj = { objects: 0 };
            config.forEach(function (conf) {
                obj[conf.name] = 0.0
            });
            users[user] = obj;
        }
        users[user].objects += 1;
        const exp = processExperience(val, config)
        
        config.forEach(function (conf) {
            users[user][conf.name] += exp[conf.name]
        });
    });
    done(null, users);
};


// Go thru each tag and return object with only one count value and the rest 0
function processExperience(feature, config) {
    const expData = {};
    config.forEach(function (conf) {
        expData[conf.name] = 0.0
    });
    config.forEach(function (conf) {
        const filter = filters[conf.name];
        const geometry = filter.geometry
        const tag = filter.tag
        const amenity = filter.amenity
        if (tag && utils.hasTag(feature, tag) && utils.hasGeometry(feature, geometry)) {
            expData[conf.name] += computeExperience(feature, geometry)
        }
    });
    return expData;
}

function computeExperience(feature, geometry) {
    // This can be made more intelligent
    if (geometry === "LineString")
        return turf.lineDistance(feature, "kilometers");
    else if (geometry === "Point")
        return 1;
    else
        return 1;
}


