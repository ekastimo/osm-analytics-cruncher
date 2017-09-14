const keys = ['mobile_money_agent', 'bank', 'atm', 'credit_institution', 'icrofinance_bank', 'microfinance', 'sacco', 'bureau_de_change', 'money_transfer', 'post_office'];

const sums = []
const divisors = []
const maxProps = []
keys.forEach((key) => {
    const sumKey = `_${key}Count`;
    const divKey = `_per_${key}Count`;
    sums.push(
        { name: sumKey, prop: sumKey }
    )
    maxProps.push(
        sumKey, divKey
    )
    divisors.push(
        { name: divKey, divident: sumKey, divisor: '_population' }
    )
})
const config = {
    aggregate: {
        sum: sums,
        population: true,
        divisors
    },
    downscale: {
        max: maxProps,
    }
}

module.exports = config