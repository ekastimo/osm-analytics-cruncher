#!/usr/bin/env node
'use strict';
var tilereduce = require('tile-reduce'),
    path = require('path');
var mbtilesPath = process.argv[1] || '../results/mobilemoney.mbtiles';
////_populationDensity, _peoplePerAgent, _economicActivity, _noOfMMAgents, _xcount
var _property = process.argv[2] || '_economicActivity';
var opts = {
    zoom: 3,
    sourceCover: 'osm',
    sources: [
        {
            name: 'osm',
            mbtiles: path.join(__dirname, '../intermediate/mobilemoney.z12.mbtiles'),
            layers: ['osm'],
            raw: false
        }
    ],
    
    mapOptions: {
        _property: '_economicActivity'
	},
    map: __dirname + '/counter-map-min.js'
};

var minValue = 100;
tilereduce(opts)
    .on('error', function (error) {
        throw error;
    })
    .on('reduce', function (num) {
        console.log(">>>"+num);
        if (minValue > num)
            minValue = num;
    })
    .on('end', function () {
        console.log('Min Value is: %d', minValue);
    });