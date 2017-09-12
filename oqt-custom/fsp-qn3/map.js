'use strict';
var fs = require('fs');
var turf = require('turf');
var lineclip = require('lineclip');
var stats = require('simple-statistics');
var sphericalmercator = new (require('sphericalmercator'))({ size: 512 });
const utils = require("../../oqt-utils/utils");
var filter = global.mapOptions.filter;
const getBankName = utils.getBankName;
const getPropsLike = utils.getPropsLike;
const hasAmenity = utils.hasAmenity;
const hasTag = utils.hasTag;
const readCompositeProps = utils.readCompositeProps;
const isMMAgent = utils.isMMAgent;
const isATM = utils.isATM;
const isBank = utils.isBank;
const filterFeatures = utils.filterFeatures;
const getClipper = utils.getClipper;
const isWithin = utils.isWithin;
const computeEconActivity = utils.computeEconActivity;

module.exports = function (tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;
    var popn = tileLayers.popn.population;
    layer.features = filterFeatures(layer.features, filter);
    var poly = turf.bboxPolygon(sphericalmercator.bbox(tile[0], tile[1], tile[2]));
    popn.features.forEach(function (popnFeature) {
        const counts = {
            mmCount: 0, hwCount: 0, bCount: 0,
        }
        layer.features.forEach(function (osmFeature) {
            if (isMMAgent(osmFeature) && isWithin(osmFeature, popnFeature))
                counts.mmCount += 1
            else if (hasTag(osmFeature, "highway") && isWithin(osmFeature, popnFeature))
                counts.hwCount += 1
            else if (hasTag(osmFeature, "building") && isWithin(osmFeature, popnFeature))
                counts.bCount += 1

        });
        const noOfPeople = popnFeature.properties['Popn_count'];
        const economicActivity = computeEconActivity(counts.bCount, counts.mmCount, counts.hwCount, noOfPeople)
        popnFeature.properties['economicActivity'] = economicActivity;

        //var intersection = turf.intersect(popnFeature, poly);
        //intersection.properties = popnFeature.properties;
        writeData(JSON.stringify([popnFeature,poly]) + ',\n');
    });

    //writeData(JSON.stringify(popn) + '\n');
    done();
};