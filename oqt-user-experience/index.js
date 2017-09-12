#!/usr/bin/env node
'use strict';
var tileReduce = require('tile-reduce');
var path = require('path');
var config = require("../osm-filters/config.json");
var mbtilesPath = process.argv[2] || "osm.mbtiles";

var users = {};

tileReduce({
    map: path.join(__dirname, '/map.js'),
    sources: [{
        name: 'osm',
        mbtiles: mbtilesPath,
        raw: false
    }],
    mapOptions: {
        config: config,
    },
})
    .on('reduce', function (d) {
        for (var u in d) {
            if (!users[u]) {
                const obj = { objects: 0 };
                config.forEach(function (filter) {
                    obj[filter] = 0.0
                });
                users[u] = obj
            }
            users[u].objects += d[u].objects;
            config.forEach(function (filter) {
                users[u][filter] += d[u][filter]
            });
        }
    })
    .on('end', function () {
        process.stdout.write(JSON.stringify(users, null, 4));
    });
