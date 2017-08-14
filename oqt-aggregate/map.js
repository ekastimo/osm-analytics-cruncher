'use strict';
var turf = require('turf');
var lineclip = require('lineclip');
var sphericalmercator = new (require('sphericalmercator'))({ size: 512 });
var rbush = require('rbush');
var lodash = require('lodash');
var stats = require('simple-statistics');

const utils = require("../utils");
const getBankName = utils.getBankName;
const getPropsLike = utils.getPropsLike;
const hasAmenity = utils.hasAmenity;
const hasTag = utils.hasTag;
const readCompositeProps = utils.readCompositeProps;
const isMMAgent = utils.isMMAgent;
const isATM = utils.isATM;
const isBank = utils.isBank;
const selectedBanks = require('../banks-atms-list.json');
var filter = global.mapOptions.filter || {};
var fspConfig = filter['fsp'];
const _MAX_DISTANCE = filter['MAX_DISTANCE'] || 1000000;// TODO use more educated constant
var binningFactor = global.mapOptions.binningFactor; // number of slices in each direction

Array.prototype.scaleBetween = function (scaledMin, scaledMax) {
    var max = Math.max.apply(Math, this);
    var min = Math.min.apply(Math, this);
    return this.map(num => (scaledMax - scaledMin) * (num - min) / (max - min) + scaledMin);
}

module.exports = function (tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;
    var popn = fspConfig ? tileLayers.popn['12geojson'] : {};
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
            // Clipper always retuns true coz a point will always lie in the bin after bintree search
            clipper = function (a, b) { return { length: 1 } };
            geometry = feature.geometry.coordinates;
        } else return;// todo: support more geometry types


        var featureBbox = turf.extent(feature);
        var featureBins = binTree.search(featureBbox).filter(function (bin) {
            return clipper(geometry, bin).length > 0;
        });

        //New props for the feature bins
        const newProps = {
            //id: feature.properties._osm_way_id, // todo: rels??
            _timestamp: feature.properties._timestamp,
            _userExperience: feature.properties._userExperience,
        };

        if (fspConfig) {
            // Used by Qn 1
            const counts = countTagsAndAmenities(feature);
            Object.assign(newProps, counts);
            //Read extra props for qn2
            if (fspConfig === 'qn2' && isMMAgent(feature)) {
                const props = feature.properties;
                const extraProps = readCompositeProps(feature, filter);
                Object.assign(newProps, extraProps);
            }
        }

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
            if (!binObjects[index])
                binObjects[index] = [];
            binObjects[index].push(newProps);
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

        if (!fspConfig)
            return;// Ignore FSP Computations
        // FSP Computation
        // TODO Find way of processing via config
        if (fspConfig === 'qn1') {
            var noOfBuildings = stats.sum(lodash.map(binObjects[index], '_buildingCount'));
            var noOfMMAgents = stats.sum(lodash.map(binObjects[index], '_mobile_money_agentCount'));
            var noOfHighways = stats.sum(lodash.map(binObjects[index], '_highwayCount'));
            var noOfPeople = getPopulation(feature, popn.features);
            var peoplePerAgent = (noOfMMAgents <= 0) ? 0 : Math.ceil(noOfPeople / noOfMMAgents);
            var economicActivity = computeEconActivity(noOfBuildings, noOfMMAgents, noOfHighways, noOfPeople);

            feature.properties._populationDensity = noOfPeople;
            feature.properties._peoplePerAgent = peoplePerAgent;
            feature.properties._economicActivity = economicActivity;
            feature.properties._noOfMMAgents = noOfMMAgents;
        } else if (fspConfig === 'qn2') {
            var _bankCount = stats.sum(lodash.map(binObjects[index], '_bankCount'));
            var noOfMMAgents = stats.sum(lodash.map(binObjects[index], '_mobile_money_agentCount'));
            feature.properties._noOfMMAgents = noOfMMAgents;
            feature.properties._xcount = noOfMMAgents;

            // Give the cell the min distance from a bank
            // This is computed from the properties agregated during bining
            const dynamicProps = ["_distanceFromBank", "_distanceFromATM"];
            selectedBanks.forEach(function (bank) {
                dynamicProps.push(`_bank_${bank.name}`);
                dynamicProps.push(`_atm_${bank.name}`);
            });

            dynamicProps.forEach(function (propName) {
                const minValue = stats.min(binObjects[index].map(_bin => _bin[propName] || _MAX_DISTANCE));
                feature.properties[propName] = minValue;
            })
        }
    });

    output.features = output.features.filter(function (feature) {
        return feature.properties._xcount > 0;
    });

    output.properties = { tileX: tile[0], tileY: tile[1], tileZ: tile[2] };
    writeData(JSON.stringify(output) + '\n');
    done();
};

function countTagsAndAmenities(feature) {
    const tagsAndMenities = {};
    filter.tags.forEach(function (tag) {
        tagsAndMenities[`_${tag}Count`] = hasTag(feature, tag) ? 1 : 0;
    });
    filter.amenities.forEach(function (amenity) {
        tagsAndMenities[`_${amenity}Count`] = hasAmenity(feature, amenity) ? 1 : 0
    });
    return tagsAndMenities;
}

function getScaled(num, max, min) {
    return [min, num, max].scaleBetween(1, 10)[1];
}

function computeEconActivity(noOfBuildings, noOfMMAgents, noOfHighways, noOfPeople) {
    const scaledMin = 0.3010299956639812;// Pre attained value
    const scaledMax = 4.072984744627931;// Pre attained value
    const total = noOfBuildings + noOfMMAgents + noOfHighways + noOfPeople;
    // TODO make more intelligent computation
    const value = total <= 0 ? 0 : Math.log10(total);
    return getScaled(value, scaledMin, scaledMax);
}

function getPopulation(binFeature, features) {
    const centroid = turf.centroid(binFeature);
    for (var i = 0; i < features.length; i++) {
        const nextPoly = features[i];
        if (turf.inside(centroid, nextPoly)) {
            return Math.ceil(nextPoly['properties']['Popn_count']);
        }
    }
    return 0;
}