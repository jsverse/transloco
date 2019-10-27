const omitby = require('lodash.omitby');

function omitDeepLodash(input, predicate) {
  function omitDeepOnOwnProps(obj) {
    if (!Array.isArray(obj) && !isObject(obj)) {
      return obj;
    }

    const o = {};
    for (const [key, value] of Object.entries(obj)) {
      o[key] = !isNil(value) ? omitDeepLodash(value, predicate) : value;
    }

    return omitby(o, predicate);
  }

  return omitDeepOnOwnProps(input);
}

function isNil(value) {
  return value === null || value === undefined;
}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

function removeComments(translation, keyName) {
  return omitDeepLodash(translation, (v, k) => {
    return k.endsWith(keyName);
  });
}

module.exports = removeComments;
