#!/usr/bin/env node
const commandLineArgs = require('command-line-args');
const fs = require('fs');
const glob = require('glob');
const removeComments = require('./remove-comments');

const optionDefinitions = [
  { name: 'keyName', alias: 'v', type: String, defaultValue: 'comment' },
  { name: 'src', alias: 'p', type: String, defaultOption: true }
];

const { src, keyName } = commandLineArgs(optionDefinitions);
const path = `${process.cwd()}/${src}`;

glob(`${path}/**/*.json`, {}, function(er, files) {
  files.forEach(path => {
    // TODO: Run in parallel
    fs.readFile(path, 'utf8', function(err, translation) {
      const toObject = JSON.parse(translation);
      let withoutComments = removeComments(toObject, keyName);

      fs.writeFile(path, JSON.stringify(withoutComments, null, 2), 'utf8', function(err) {
        if (err) return console.log(err);
      });
    });
  });
});
