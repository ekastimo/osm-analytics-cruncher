const config = {
    aggregate: {
        sum: [
            { name: '_buildingCount', prop: '_buildingCount' },
            { name: '_noOfMMAgents', prop: '_mobile_money_agentCount' },
            { name: '_highwayCount', prop: '_highwayCount' },
        ],
        population: true,
        economic: true,
        divisors: [
            { name: '_peoplePerAgent', divident: '_noOfMMAgents', divisor: '_population' }
        ]
    },
    downscale: {
        max: ['_noOfMMAgents', '_population','_economicActivity','_peoplePerAgent'],
    }
}

module.exports = config