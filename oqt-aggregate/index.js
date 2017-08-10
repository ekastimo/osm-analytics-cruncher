#!/usr/bin/env node
'use strict';
var tileReduce = require('tile-reduce');
var path = require('path');
var fs = require('fs');

var mbtilesPath = process.argv[2] || "osm.mbtiles";
var binningFactor = +process.argv[3] || 100;
var filterPath = process.argv[4] || './filter.json';

var filter = JSON.parse(fs.readFileSync(filterPath));
var fspConfig = filter['fsp'];
var sources = [
    {
        name: 'osm',
        mbtiles: mbtilesPath,
        raw: false
    }
];
// Load Population data only during FSP Config
if (fspConfig) {
    sources.push(
        {
            name: 'popn',
            mbtiles: path.join(__dirname, '../popn.mbtiles'),
            layers: ['12geojson'],
            raw: false
        }
    );
}
tileReduce({
    map: path.join(__dirname, '/map.js'),
    log: false,
    sources: sources,
    mapOptions: {
        binningFactor: binningFactor,
        filter: filter,
    }
})
    .on('reduce', function (d) {
    })
    .on('end', function () {
    });
