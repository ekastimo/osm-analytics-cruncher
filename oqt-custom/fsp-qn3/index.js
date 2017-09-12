#!/usr/bin/env node
'use strict';
var tileReduce = require('tile-reduce');
var path = require('path');
var fs = require('fs');
var mbtilesPath = process.argv[2] || "osm.mbtiles";
var filterPath = process.argv[3] || './filter.json';
var filter = JSON.parse(fs.readFileSync(filterPath));
var sources = [
    {
        name: 'osm',
        mbtiles: mbtilesPath,
        raw: false
    },
    {
        name: 'popn',
        mbtiles: 'population.mbtiles',
        layers: ['population'],
        raw: false
    }
];

tileReduce({
    map: path.join(__dirname, '/map.js'),
    log: false,
    sources: sources,
    mapOptions: {
        filter: filter,
    }
})
    .on('reduce', function (d) {
    })
    .on('end', function () {
    });
