#!/usr/bin/env node
'use strict';
var tileReduce = require('tile-reduce');
var path = require('path');

var mbtilesPath = process.argv[2] || "osm.mbtiles";

tileReduce({
    map: path.join(__dirname, '/map.js'),
    log: false,
    sources: [{
        name: 'osm',
        mbtiles: mbtilesPath,
        raw: false
    }]
})
    .on('start', function () {
        console.log('[');
    })
    .on('end', function () {
    });
