'use strict';
var turf = require('turf');
var lineclip = require('lineclip');


Array.prototype.scaleBetween = function (scaledMin, scaledMax) {
    var max = Math.max.apply(Math, this);
    var min = Math.min.apply(Math, this);
    return this.map(num => (scaledMax - scaledMin) * (num - min) / (max - min) + scaledMin);
}


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

function processComposite(feature, filter) {
    var tags = filter.tags;
    var hasAnyTag = false;
    tags.forEach(function (tag) {
        hasAnyTag = hasAnyTag || hasTag(feature, tag);
    });

    var amenities = filter.amenities;
    var hasAnyAmenity = false;
    amenities.forEach(function (amenity) {
        hasAnyAmenity = hasAnyAmenity || hasAmenity(feature, amenity);
    });
    return hasAnyTag || hasAnyAmenity;
}

const filterFeatures = (features, filter) => {
    return features.filter(function (feature) {
        if (filter.composite) {
            return processComposite(feature, filter);
        }
        return feature.geometry.type === filter.geometry && hasTag(feature, filter.tag);
    });
}

function getClipper(feature) {
    var clipper,
        geometry;
    if (feature.geometry.type === 'LineString') {
        clipper = lineclip.polyline;
        geometry = feature.geometry.coordinates;
    } else if (feature.geometry.type === 'Polygon') {
        clipper = lineclip.polygon;
        geometry = feature.geometry.coordinates[0];
    } else if (feature.geometry.type === 'Point') {
        clipper = lineclip.polyline;
        geometry = feature.geometry.coordinates;
    } else if (feature.geometry.type === 'MultiPolygon') {
        clipper = lineclip.polygon;
        geometry = feature.geometry.coordinates[0][0];
    } else return undefined;// todo: support more geometry types
    return { clipper, geometry }
}


function isWithin(feature, feature2) {
    if (feature.geometry.type === 'LineString') {
        var featureBbox = turf.extent(feature2);
        const geometry = feature.geometry.coordinates;
        return lineclip.polyline(geometry, featureBbox).length > 0;
    } else if (feature.geometry.type === 'Polygon') {
        var featureBbox = turf.extent(feature2);
        const geometry = feature.geometry.coordinates[0];
        return lineclip.polygon(geometry, featureBbox).length > 0;
    } else if (feature.geometry.type === 'Point') {
        return turf.inside(feature, feature2);
    } else return false;
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
    isMMAgent,
    filterFeatures,
    getClipper,
    isWithin,
    computeEconActivity
};