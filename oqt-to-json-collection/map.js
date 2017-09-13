'use strict';
const fs = require('fs');
const utils = require("../oqt-utils/utils");
const filterFeatures = utils.filterFeatures;
const filterPath = global.mapOptions.filterPath;
const filter = filterPath ? JSON.parse(fs.readFileSync(global.mapOptions.filterPath)) : false;
module.exports = function (tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;
    if (filter)
        layer.features = filterFeatures(layer.features, filter);
    layer.features.forEach(function (feature) {
        writeData(JSON.stringify(feature) + '\n,');
    });
    done();
};
