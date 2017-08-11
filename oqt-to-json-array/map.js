'use strict';
module.exports = function (tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;
    layer.features.forEach(function (feature) {
        writeData(JSON.stringify(feature) + '\n,');
    });
    done();
};
