module.exports = function (tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;
    var property = global.mapOptions._property;
    const max = layer.features.reduce(function (prev, feature) {
        const value = feature.properties[property];
        if (value && value < prev) {
            return value;
        } else {
            return prev;
        }
    }, 100);
    done(null,max);
};