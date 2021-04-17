'use strict';

module.exports = {
    isObject
};

function isObject (params) {
    return Object.prototype.toString(params) === '[object Object]'
}