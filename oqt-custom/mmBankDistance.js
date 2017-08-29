#!/usr/bin/env node
'use strict';
var fs = require('fs');
var turf = require('turf');
var stats = require('simple-statistics');
const utils = require("../oqt-utils/utils");
const getBankName = utils.getBankName;
const getPropsLike = utils.getPropsLike;
const hasAmenity = utils.hasAmenity;
const hasTag = utils.hasTag;
const readCompositeProps = utils.readCompositeProps;
const isMMAgent = utils.isMMAgent;
const isATM = utils.isATM;
const isBank = utils.isBank;

var bankATMData = require('../banks-atms-data.json');
var mmAgents = require('../mobilemoneyagents-data.json');
var selectedBanks = require('../banks-atms-list.json');
const _MAX_DISTANCE = 1000000;

function enrichAgents() {
    var distBanks = [];
    var distATMs = [];
    var bankCollection = {};
    var atmCollection = {};
    process.stdout.write("[");
    mmAgents.forEach(feature => {
        
        bankATMData.forEach(function (bank) {
            const to = (bank.type === 'Point') ? bank : turf.centroid(bank)
            const rawName = bank.properties._name;
            const bankName = rawName ? getBankName(rawName, selectedBanks) : 'unknown';
            const distance = turf.distance(feature, to, "kilometers")* 1000;
            if (isBank(bank)) {
                distBanks.push(distance);
                if (bankCollection[bankName]) {
                    bankCollection[bankName].push(distance);
                } else {
                    bankCollection[bankName] = [distance];
                }
            } else if (isATM(bank)) {
                if (atmCollection[bankName]) {
                    atmCollection[bankName].push(distance);
                } else {
                    atmCollection[bankName] = [distance];
                }
            }
        });
        
        feature.properties._distanceFromBank = distBanks.length > 0 ? stats.min(distBanks) : _MAX_DISTANCE;
        feature.properties._distanceFromATM = distATMs.length > 0 ? stats.min(distATMs) : _MAX_DISTANCE;
        for (let bank in bankCollection) {
            const distances = bankCollection[bank];
            feature.properties[`_bank_${bank}`] = distances.length > 0 ? stats.min(distances) : _MAX_DISTANCE;
        }
        for (let atm in atmCollection) {
            const distances = atmCollection[atm];
            feature.properties[`_atm_${atm}`] = distances.length > 0 ? stats.min(distances) : _MAX_DISTANCE;
        }
        process.stdout.write(JSON.stringify(feature)+"\n,");
    });
}


enrichAgents();