const utils = require("../oqt-utils/utils");
const getBankName = utils.getBankName;
const selectedBanks = require('../banks-atms-list.json');


const dynamicProps = ["_distanceFromBank", "_distanceFromATM"];
selectedBanks.forEach(function (bank) {
    dynamicProps.push(`_bank_${bank.name}`);
    dynamicProps.push(`_atm_${bank.name}`);
});
const config = {
    operator: undefined,
    operatorFxn: (rawName) => {
        return getBankName(rawName, selectedBanks)
    },
    isMain: (feature) => utils.isMMAgent(feature),
    "main": {
        name: "mobile_money_agent",
        checker: (feature) => utils.isMMAgent(feature)
    }
    ,
    "distances": [
        {
            name: "bank",
            checker: (feature) => utils.isBank(feature),
            getName: (feature) => utils.getBankName(feature.properties.name || 'Other', selectedBanks),
            propName: '_distanceFromBank',
            propNameSurfix: '_bank_'
        },
        {
            name: "atm",
            checker: (feature) => utils.isATM(feature),
            getName: (feature) => utils.getBankName(feature.properties.name || 'Other', selectedBanks),
            propName: '_distanceFromATM',
            propNameSurfix: '_atm_'
        }
    ],
    "max-distance": 1000000,
    aggregate: {
        min: dynamicProps,
        sum: [
            { name: '_bankCount', prop: '_bankCount' },
            { name: '_noOfMMAgents', prop: '_mobile_money_agentCount' },
        ]
    },
    downscale: {
        min: dynamicProps,
        max: ['_noOfMMAgents', '_bankCount', '_xcount'],
    }
    ////_distanceFromBank,_distanceFromATM,_noOfMMAgents
}

module.exports = config