'use strict';
var fs = require('fs');
var turf = require('turf');
var stats = require('simple-statistics');
const utils = require("../../oqt-utils/utils");
const getBankName = utils.getBankName;
const getPropsLike = utils.getPropsLike;
const hasAmenity = utils.hasAmenity;
const hasTag = utils.hasTag;
const readCompositeProps = utils.readCompositeProps;
const isMMAgent = utils.isMMAgent;
const isATM = utils.isATM;
const isBank = utils.isBank;

var mmAgentsEnriched = require('../../results/json/mm-bank-dist.json');
var selectedBanks = require('../../banks-atms-list.json');

function compare(a, b) {
    if (a.count < b.count) {
        return 1;
    }
    if (a.count > b.count) {
        return -1;
    }
    return 0;
}

function getAgentsInRange(min, max) {
    var distBanks = [];
    var distATMs = [];
    var bankCollection = {};
    var atmCollection = {};

    mmAgentsEnriched.features.forEach(feature => {
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

module.exports = { getAgentsInRange };
//console.log(getAgentsInRange(0, 2000));