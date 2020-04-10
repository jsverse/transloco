const fs = require('fs');
const glob = require('glob');
const flatten = require('flat');

function translocoOptimize(params) {
  const dirPath = `${process.cwd()}/${params.dist}`;

  return new Promise(resolve => {
    let count = 0;
    glob(`${dirPath}/**/*.json`, {}, function(er, files) {
      const len = files.length;
      files.forEach(filePath => {
        fs.readFile(filePath, 'utf8', function(err, translation) {
          const toObject = JSON.parse(translation);
          const flattenObject = flatten(toObject, { safe: true });
          const withoutComments = removeComments(flattenObject, params.commentsKey);
          fs.writeFile(filePath, JSON.stringify(withoutComments), 'utf8', function(err) {
            count++;
            if (count === len) {
              console.log('Transloco optimization is done!');
              resolve();
            }
            if (err) return console.log(err);
          });
        });
      });
    });
  });
}

function removeComments(translation, keyName = 'comment') {
  return Object.keys(translation).reduce((acc, key) => {
    const splitted = key.split('.');
    if (splitted[splitted.length - 1] !== keyName) {
      acc[key] = translation[key];
    }
    return acc;
  }, {});
}

module.exports = translocoOptimize;
