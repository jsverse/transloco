'use strict';
const findDuplicatedPropertyKeys = require('find-duplicated-property-keys');
const fs = require('fs');

module.exports = function(translationFiles) {
  translationFiles.forEach(path => {
    const translation = fs.readFileSync(path, 'utf-8');

    // Verify that we can parse the JSON
    JSON.parse(translation);

    // Verify that we don't have any duplicate keys
    let result = findDuplicatedPropertyKeys(translation);
    if (result.length) {
      throw new Error(`Found duplicate keys: ${result.map(r => r.key)} (${path})`);
    }
  });
};
