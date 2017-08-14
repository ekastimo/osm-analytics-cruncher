'use strict';

const hasAmenity = function (feature, amenity) {
    return feature.properties['amenity'] && feature.properties['amenity'] === amenity;
}

// filter
const hasTag = function (feature, tag) {
    return feature.properties[tag] && feature.properties[tag] !== 'no';
}

const getPropLike = function (feature, prop) {
    const keys = Object.keys(feature.properties);
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].indexOf(prop) >= 0) {
            return keys[i];
        }
    }
    return undefined;
}

const getPropsLike = function (feature, prop) {
    const propsLike = [];
    const keys = Object.keys(feature.properties);
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].indexOf(prop) >= 0) {
            propsLike.push(keys[i]);
        }
    }
    return propsLike;
}

const isBank = function (feature) {
    return hasAmenity(feature, 'bank');
}

const isATM = function (feature) {
    return hasAmenity(feature, 'atm');
}
const isMMAgent = function (feature) {
    return hasAmenity(feature, 'mobile_money_agent');
}

const getBankName = function (rawName, selectedBanks) {
    for (let i = 0; i < selectedBanks.length; i++) {
        const bank = selectedBanks[i];
        const tags = bank.tags;
        for (let j = 0; j < tags.length; j++) {
            if (rawName.toLowerCase().indexOf(tags[j].toLowerCase()) >= 0)
                return selectedBanks[i].name;
        }
    }
    return "unclassified";
}


const readCompositeProps = function (feature, filter) {
    var extraProps = {};
    if (filter.tags) {
        filter.tags.forEach(function (tag) {
            if (hasTag(feature, tag)) {
                extraProps[tag] = feature.properties[tag];
            }
        });
    }

    if (filter.amenities) {
        filter.amenities.forEach(function (amenity) {
            if (hasAmenity(feature, amenity)) {
                extraProps["amenity"] = feature.properties["amenity"];
            }
        });
    }

    if (filter.extraFields) {
        filter.extraFields.forEach(function (field) {
            const props = getPropsLike(feature, field);
            props.forEach(function (propName) {
                extraProps[propName] = feature.properties[propName];
            })
        });
    }
    return extraProps;
}


module.exports = {
    hasAmenity,
    hasTag,
    getBankName,
    getPropLike,
    getPropsLike,
    getBankName,
    readCompositeProps,
    isATM,
    isBank,
    isMMAgent
};