#!/usr/bin/env node
'use strict';
var tileReduce = require('tile-reduce');
var path = require('path');

var mbtilesPath = process.argv[2] || "osm.mbtiles";
var _property = process.argv[3] || '_count';
var opts = {
    map: path.join(__dirname, '/max-map.js'),
    log: false,
    sources: [{
        name: 'osm',
        mbtiles: mbtilesPath,
        raw: false
    }],
    mapOptions: {
        _property: _property,
    },
};

var maxValue = 0;
tileReduce(opts)
    .on('error', function (error) {
        throw error;
    })
    .on('reduce', function (num) {
        if (maxValue < num)
            maxValue = num;
    })
    .on('end', function () {
        console.log('Max Value is: %d', maxValue);
    });