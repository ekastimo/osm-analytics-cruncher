#!/usr/bin/env node
'use strict';
var tileReduce = require('tile-reduce');
var path = require('path');

var mbtilesPath = process.argv[2] || "osm.mbtiles",
filterPath = process.argv[3] || './filter.json';

tileReduce({
    map: path.join(__dirname, '/map.js'),
    log: false,
    sources: [{
        name: 'osm',
        mbtiles: mbtilesPath,
        raw: false
    }],
    mapOptions: {
        filterPath: filterPath,
    }
})
    .on('start', function () {
        console.log('{"type":"FeatureCollection","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}},"features":[');
    })
    .on('end', function () {
    });
