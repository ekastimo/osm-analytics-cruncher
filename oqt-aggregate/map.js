'use strict';
var turf = require('turf');
var lineclip = require('lineclip');
var sphericalmercator = new (require('sphericalmercator'))({ size: 512 });
var rbush = require('rbush');
var lodash = require('lodash');
var stats = require('simple-statistics');

var binningFactor = global.mapOptions.binningFactor; // number of slices in each direction

module.exports = function (tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;
    var tileBbox = sphericalmercator.bbox(tile[0], tile[1], tile[2]);

    var bins = [],
        bboxMinXY = sphericalmercator.px([tileBbox[0], tileBbox[1]], tile[2]),
        bboxMaxXY = sphericalmercator.px([tileBbox[2], tileBbox[3]], tile[2]),
        bboxWidth = bboxMaxXY[0] - bboxMinXY[0],
        bboxHeight = bboxMaxXY[1] - bboxMinXY[1];
    for (var i = 0; i < binningFactor; i++) {
        for (var j = 0; j < binningFactor; j++) {
            var binMinXY = [
                bboxMinXY[0] + bboxWidth / binningFactor * j,
                bboxMinXY[1] + bboxHeight / binningFactor * i
            ], binMaxXY = [
                bboxMinXY[0] + bboxWidth / binningFactor * (j + 1),
                bboxMinXY[1] + bboxHeight / binningFactor * (i + 1)
            ];
            var binMinLL = sphericalmercator.ll(binMinXY, tile[2]),
                binMaxLL = sphericalmercator.ll(binMaxXY, tile[2]);
            bins.push([
                binMinLL[0],
                binMinLL[1],
                binMaxLL[0],
                binMaxLL[1],
                i * binningFactor + j
            ]);
        }
    }
    var binCounts = Array(bins.length + 1).join(0).split('').map(Number); // initialize with zeros
    var _binCounts = Array(bins.length + 1).join(0).split('').map(Number); // initialize with zeros
    var binDistances = Array(bins.length + 1).join(0).split('').map(Number); // initialize with zeros
    var binObjects = Array(bins.length);
    var binTree = rbush();// Tree to help in search for feature bound bins
    binTree.load(bins);

    layer.features.forEach(function (feature) {
        var clipper,
            geometry;
        if (feature.geometry.type === 'LineString') {
            clipper = lineclip.polyline;
            geometry = feature.geometry.coordinates;
        } else if (feature.geometry.type === 'Polygon') {
            clipper = lineclip.polygon;
            geometry = feature.geometry.coordinates[0];
        } else if (feature.geometry.type === 'Point') {
            clipper = function (a, b) { return { length: 1 } };
            geometry = feature.geometry.coordinates;
        } else return;// todo: support more geometry types


        var featureBbox = turf.extent(feature);
        var featureBins = binTree.search(featureBbox).filter(function (bin) {
            return clipper(geometry, bin).length > 0;
        });

        const _isBuilding = isBuilding(feature) ? 1 : 0;
        const _isMMAgent = isMMAgent(feature) ? 1 : 0;
        const _isHighWay = isHighWay(feature) ? 1 : 0;

        //console.log({_isBuilding,_isMMAgent,_isHighWay,feature:feature.properties});
        // Append feature bins to the rest of bins
        featureBins.forEach(function (bin) {
            var index = bin[4];
            binCounts[index] += 1 / featureBins.length;
            _binCounts[index] += 1;
            if (feature.geometry.type === 'LineString') {
                clipper(geometry, bin).forEach(function (coords) {
                    binDistances[index] += turf.lineDistance(turf.linestring(coords), 'kilometers');
                });
            }
            if (!binObjects[index]) binObjects[index] = [];
            binObjects[index].push({
                //id: feature.properties._osm_way_id, // todo: rels??
                _timestamp: feature.properties._timestamp,
                _userExperience: feature.properties._userExperience,
                _buildingCount: _isBuilding,
                _mmAgentCount: _isMMAgent,
                _highwayCount: _isHighWay,
            });
        });
    });

    var output = turf.featurecollection(bins.map(turf.bboxPolygon));
    output.features.forEach(function (feature, index) {
        feature.properties.binX = index % binningFactor;
        feature.properties.binY = Math.floor(index / binningFactor);
        feature.properties._count = binCounts[index];
        feature.properties._xcount = _binCounts[index];
        feature.properties._lineDistance = binDistances[index];

        if (!(binCounts[index] > 0)) return;
        feature.properties._timestamp = lodash.meanBy(binObjects[index], '_timestamp'); // todo: don't hardcode properties to average?
        feature.properties._userExperience = lodash.meanBy(binObjects[index], '_userExperience');
        //feature.properties.osm_way_ids = binObjects[index].map(function(o) { return o.id; }).join(';');
        // ^ todo: do only partial counts for objects spanning between multiple bins?
        var timestamps = lodash.map(binObjects[index], '_timestamp');
        feature.properties._timestampMin = stats.quantile(timestamps, 0.25);
        feature.properties._timestampMax = stats.quantile(timestamps, 0.75);
        feature.properties._timestamps = lodash.sampleSize(timestamps, 16).join(';');
        var experiences = lodash.map(binObjects[index], '_userExperience');
        feature.properties._userExperienceMin = stats.quantile(experiences, 0.25);
        feature.properties._userExperienceMax = stats.quantile(experiences, 0.75);
        feature.properties._userExperiences = lodash.sampleSize(experiences, 16).join(';');

        // FSP Computation
        // TODO add some kind of filter
        var noOfBuildings = stats.sum(lodash.map(binObjects[index], '_buildingCount'));
        var noOfMMAgents = stats.sum(lodash.map(binObjects[index], '_mmAgentCount'));
        var noOfHighways = stats.sum(lodash.map(binObjects[index], '_highwayCount'));
        var noOfPeople = computePopulationDensity(feature.geometry);
        feature.properties._populationDensity = noOfPeople;
        feature.properties._peoplePerAgent = noOfPeople;
        feature.properties._economicActivity = computeEconActivity(feature.geometry);
        feature.properties._noOfMMAgents = noOfMMAgents;
        //console.log({ count: _binCounts[index], noOfBuildings, noOfMMAgents, noOfHighways });
        //_populationDensity, _peoplePerAgent, _economicActivity, _noOfMMAgents, _xcount
    });
    output.features = output.features.filter(function (feature) {
        return feature.properties._xcount > 0;
    });
    output.properties = { tileX: tile[0], tileY: tile[1], tileZ: tile[2] };
    writeData(JSON.stringify(output) + '\n');
    done();
};


function isBuilding(f, amenity) {
    return f.properties['building'] && f.properties['building'] !== 'no';
}

function isMMAgent(f) {
    var resp = f.properties['amenity'] && f.properties['amenity'] === "mobile_money_agent";
    return resp;
}

function isHighWay(f) {
    return f.properties['highway'] && f.properties['highway'] !== 'no';
}


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function computeEconActivity(geometry) {
    // TODO do actual computation
    return getRandomInt(0, 8);
}


function computePopulationDensity(geometry) {
    // TODO do actual computation
    return getRandomInt(0, 10);
}

function computePeoplePerAgent(geometry) {
    // TODO do actual computation
    return getRandomInt(0, 1000);
}
