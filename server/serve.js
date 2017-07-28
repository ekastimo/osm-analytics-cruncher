const express = require('express');
const http = require('http');
const app = express();
const tilelive = require('tilelive');
require('mbtiles').registerProtocols(tilelive);

function initServer(tilesData) {
    app.set('port', 7778);

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
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


tilelive.load('mbtiles://../results/buildings.mbtiles', function (err, buildings) {
    if (err) {
        throw err;
    }

    tilelive.load('mbtiles://../results/highways.mbtiles', function (err, highways) {
        if (err) {
            throw err;
        }
        tilelive.load('mbtiles://../results/railways.mbtiles', function (err, railways) {
            if (err) {
                throw err;
            }
            tilelive.load('mbtiles://../results/mobilemoney.mbtiles', function (err, mobilemoney) {
                if (err) {
                    throw err;
                }
                tilelive.load('mbtiles://../results/generic.mbtiles', function (err, generic) {
                if (err) {
                    throw err;
                }
                var allData = {};
                allData['buildings'] = buildings;
                allData['highways'] = highways;
                allData['railways'] = railways;
                allData['mobilemoney'] = mobilemoney;
                allData['generic'] = generic;
                initServer(allData);
            });
            });
        });
    });
});
