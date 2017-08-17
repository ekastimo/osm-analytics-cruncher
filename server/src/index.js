'use strict';
var fs = require('fs');
var turf = require('turf');
var stats = require('simple-statistics');
const utils = require("../../utils");
const getBankName = utils.getBankName;
const getPropsLike = utils.getPropsLike;
const hasAmenity = utils.hasAmenity;
const hasTag = utils.hasTag;
const readCompositeProps = utils.readCompositeProps;
const isMMAgent = utils.isMMAgent;
const isATM = utils.isATM;
const isBank = utils.isBank;

var bankATMData = require('../../banks-atms-data.json');
var mmAgents = require('../../mobilemoneyagents-data.json');
var mmAgentsEnriched = require('../../mobilemoneyagents-data-enriched.json');
var selectedBanks = require('../../banks-atms-list.json');
const _MAX_DISTANCE = 1000000;

function compare(a, b) {
    if (a.count < b.count) {
        return 1;
    }
    if (a.count > b.count) {
        return -1;
    }
    return 0;
}

function getInRange(min, max) {
    const mmLength = mmAgents.length;
    var bankCollection = {};
    var atmCollection = {};
    bankATMData.forEach(function (bank) {
        const rawName = bank.properties._name;
        const bankName = rawName ? getBankName(rawName, selectedBanks) : 'unknown';
        if (isBank(bank)) {
            const location = (bank.type === 'Point') ? bank : turf.centroid(bank)
            for (let i = 0; i < mmLength; i++) {
                const agent = mmAgents[i];
                const distance = turf.distance(agent, location, "kilometers") * 1000;
                if (distance >= min && distance < max) {
                    if (!bankCollection[bankName])
                        bankCollection[bankName] = 0;
                    bankCollection[bankName] += 1;
                    break;
                }
            }
        } else {
            const location = (bank.type === 'Point') ? bank : turf.centroid(bank)
            for (let i = 0; i < mmLength; i++) {
                const agent = mmAgents[i];
                const distance = turf.distance(agent, location, "kilometers") * 1000;
                if (distance >= min && distance < max) {
                    if (!atmCollection[bankName])
                        atmCollection[bankName] = 0;
                    atmCollection[bankName] += 1;
                    break;
                }
            }
        }
    });
    const bankCounts = Object.keys(bankCollection).map(key => {
        return { name: key, count: bankCollection[key] }
    });
    const atmCounts = Object.keys(atmCollection).map(key => {
        return { name: key, count: atmCollection[key] }
    });
    bankCounts.sort(compare);
    atmCounts.sort(compare);
    return { bankCounts, atmCounts };
}


function getAgentsInRange(min, max) {
    var distBanks = [];
    var distATMs = [];
    var bankCollection = {};
    var atmCollection = {};

    mmAgentsEnriched.forEach(feature => {
        selectedBanks.forEach(function (bank) {
            const bankName = bank.name;
            const bankDist = feature.properties[`_bank_${bankName}`];
            const atmDist = feature.properties[`_atm_${bankName}`];
            if (bankDist >= min && bankDist < max) {
                if (!bankCollection[bankName])
                    bankCollection[bankName] = 0;
                bankCollection[bankName] += 1;
            }
            if (atmDist >= min && atmDist < max) {
                if (!atmCollection[bankName])
                    atmCollection[bankName] = 0;
                atmCollection[bankName] += 1;
            }
        });
    });
    const bankCounts = Object.keys(bankCollection).map(key => {
        return { name: key, count: bankCollection[key] }
    });
    const atmCounts = Object.keys(atmCollection).map(key => {
        return { name: key, count: atmCollection[key] }
    });
    bankCounts.sort(compare);
    atmCounts.sort(compare);
    return { bankCounts, atmCounts };
}

module.exports = { getInRange, getAgentsInRange };
//console.log(getAgentsInRange(0, 2000));