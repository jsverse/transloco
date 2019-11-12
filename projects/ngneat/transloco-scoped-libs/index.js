const glob = require('glob');
const path = require('path');
const fs = require('fs');


function copyTranslationFiles(input, output, entryPath, scopeName) {
  output = path.resolve(output);
  const scopeDir = path.join(output, scopeName);
  console.log(output, scopeName);
  mkRecursiveDirSync(output, scopeName);
  return new Promise(resolve => {
    glob(`${path.join(input, entryPath)}/**/*.json`, {}, function(er, files) {
      files.forEach(file => {
        const base = path.normalize(file).split(path.normalize(input))[1];
        const filePath = path.join(scopeDir, base);
        mkRecursiveDirSync(scopeDir, path.dirname(base));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        fs.copyFileSync(file, path.join(scopeDir, base));
      });

      // console.log("Done");
      // resolve();
    });
  })
}

function mkRecursiveDirSync(entry, src) {
  if(fs.existsSync(path.join(entry, src))) {
    return
  }
  const folders = src.split(path.sep);
  folders.forEach(folder => {
    entry = path.join(entry, folder);
    fs.mkdirSync(entry);
  })
}


module.exports = copyTranslationFiles;
