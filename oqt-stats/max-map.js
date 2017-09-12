module.exports = function (tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;
    var property = global.mapOptions._property;
    var maxValue = 0;
    if (layer.features.length > 0)
        layer.features.forEach(function (feature) {
            const value = feature.properties[property];
            if (value && value > maxValue) {
                maxValue = value;
            }
        });
    done(null, maxValue);
};