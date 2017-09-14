#!/usr/bin/env node
'use strict';
var tileReduce = require('tile-reduce');
var path = require('path');
var fs = require('fs');

var mbtilesPath = process.argv[2] || "osm.mbtiles";
var binningFactor = +process.argv[3] || 100;
var filterPath = process.argv[4] || './filter.json';
var fsp = process.argv[5] || false;
var filter = JSON.parse(fs.readFileSync(fsp ? `filters-fsp/${filterPath}` : `filters-osm/${filterPath}`));
var cpus = require('os').cpus().length;

tileReduce({
    map: path.join(__dirname, '/mapDownscale.js'),
    log: false,
    sources: [{
        name: 'osm',
        mbtiles: mbtilesPath,
        raw: true
    }],
    mapOptions: {
        mbtilesPath: mbtilesPath,
        binningFactor: binningFactor,
        filter: filter
    },
    maxWorkers: Math.max(1, Math.floor(cpus/4)*4 - 1) // make sure the number of threads is not divisible by 4 to make sure that there's no congestion of tiles at a particular worker
})
.on('reduce', function(d) {
})
.on('end', function() {
});
