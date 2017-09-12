'use strict';
const express = require('express');
const http = require('http');
const app = express();
const queue = require('queue-async');
const tilelive = require('tilelive');
var fs = require('fs');
require('mbtiles').registerProtocols(tilelive);
const util = require("./src/index");
function initServer(tilesData) {
    app.set('port', 7778);

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.use(express.static('../results'))

    app.get('/bankatm/:from/:to', function (req, res) {
        const from = req.params.from;
        const to = req.params.to;
        res.send(util.getAgentsInRange(from, to));
    });


    app.get('/populationdata', function (req, res) {
        res.send(util.readPopulationData());
    });
    app.get(/^\/(\w+)\/(\d+)\/(\d+)\/(\d+).pbf$/, function (req, res) {
        var dataSet = req.params[0];
        var z = req.params[1];
        var x = req.params[2];
        var y = req.params[3];
        console.log('get %s tile %d, %d, %d', dataSet, z, x, y);
        tilesData[dataSet].getTile(z, x, y, function (err, tile, headers) {
            if (err) {
                res.status(404);
                res.send(err.message);
                console.log(err.message);
            } else {
                res.set(headers);
                res.send(tile);
            }
        });
    });

    http.createServer(app).listen(app.get('port'), function () {
        console.log('Express server listening on port ' + app.get('port'));
    });
}

function loadData(name, callback) {
    tilelive.load(`mbtiles://../results/${name}.mbtiles`, function (err, buildings) {
        if (err) {
            console.log(err);
            throw err;
        }
        callback(null, { name, data: buildings });
    })
}



const tileFiles = ["buildings", "highways", "railways", "mobilemoney","waterways", "mmdistbanks", "popnbankatm","population","pimpedpopn","mybanks","fspdistribution"];


var q = queue();
tileFiles.forEach(function (file) {
    q.defer(loadData, file);
});
q.awaitAll(function (error, results) {
    if (error) {
        throw error;
    }
    const allData = {};
    results.forEach(function (rs) {
        allData[rs.name] = rs.data;
    });
    initServer(allData);
    console.log(`Loaded ${results.length} files`);
});