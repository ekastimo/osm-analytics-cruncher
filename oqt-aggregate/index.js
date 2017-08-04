#!/usr/bin/env node
'use strict';
var tileReduce = require('tile-reduce');
var path = require('path');

var mbtilesPath = process.argv[2] || "osm.mbtiles";
var binningFactor = +process.argv[3] || 100;

tileReduce({
    map: path.join(__dirname, '/map.js'),
    log: false,
    sources: [
        {
            name: 'osm',
            mbtiles: mbtilesPath,
            raw: false
        },
        {
            name: 'popn',
            mbtiles: path.join(__dirname, '../popn.mbtiles'),
            layers: ['12geojson'],
            raw: false
        }
    ],
    mapOptions: {
        binningFactor: binningFactor
    }
})
    .on('reduce', function (d) {
    })
    .on('end', function () {
    });
