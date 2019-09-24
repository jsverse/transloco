#!/usr/bin/env node
const commandLineArgs = require('command-line-args');
const fs = require('fs');
const glob = require('glob');
const flatten = require('flat');

const optionDefinitions = [
  { name: 'commentsKey', alias: 'k', type: String, defaultValue: 'comment' },
  { name: 'dist', alias: 'd', type: String, defaultOption: true }
];

const { dist, commentsKey } = commandLineArgs(optionDefinitions);
const path = `${process.cwd()}/${dist}`;

glob(`${path}/**/*.json`, {}, function(er, files) {
  files.forEach(path => {
    fs.readFile(path, 'utf8', function(err, translation) {
      const toObject = JSON.parse(translation);
      const flattenObject = flatten(toObject);
      const withoutComments = removeComments(flattenObject, commentsKey);
      fs.writeFile(path, JSON.stringify(withoutComments), 'utf8', function(err) {
        if (err) return console.log(err);
      });
    });
  });
});

function removeComments(translation, keyName) {
  return Object.keys(translation).reduce((acc, key) => {
    const splitted = key.split('.');
    if (splitted[splitted.length - 1] !== keyName) {
      acc[key] = translation[key];
    }
    return acc;
  }, {});
}
