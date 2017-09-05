'use strict';
var fs = require('fs');
const utils = require("../oqt-utils/utils");
var filter = global.mapOptions.filter;
const filterFeatures = utils.filterFeatures;
var filter = JSON.parse(fs.readFileSync(global.mapOptions.filterPath));
module.exports = function (tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;
    layer.features = filterFeatures(layer.features, filter);
    layer.features.forEach(function (feature) {
        writeData(JSON.stringify(feature) + '\n,');
    });
    done();
};
