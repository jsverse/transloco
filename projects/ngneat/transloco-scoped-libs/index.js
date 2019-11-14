const path = require('path');
const fs = require('fs');
const utils = require('./utils');

function copyScopeTranslationFiles(files, scopeDir) {
  insertPathToGitIgnore(scopeDir);
  for (let filePath of files) {
    const normalized = path.normalize(filePath);
    const fileName = path.basename(normalized);
    const dest = path.join(scopeDir, fileName);

    if (fs.existsSync(dest)) {
      mergeTranslationFile(normalized, dest);
    } else {
      fs.copyFileSync(normalized, dest);
    }
  }
}

function mergeTranslationFile(file, dest) {
  const destContent = JSON.parse(fs.readFileSync(dest, 'utf8') || '{}');
  const originContent = JSON.parse(fs.readFileSync(file, 'utf8') || '{}');
  fs.writeFileSync(dest, JSON.stringify({ ...destContent, ...originContent }, null, 2), { encoding: 'utf8' });
}

function insertPathToGitIgnore(input) {
  const gitIgnorePath = path.resolve('.gitignore');
  const normalize = utils.toLinuxFormat(input.split(process.cwd())[1]);
  let gitIgnore = fs.readFileSync(gitIgnorePath, 'utf8');
  if (gitIgnore.indexOf(normalize) === -1) {
    gitIgnore = `${gitIgnore}\n${normalize}`;
    fs.writeFileSync(gitIgnorePath, gitIgnore);
  }
}

module.exports = copyScopeTranslationFiles;
