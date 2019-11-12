const path = require('path');
const fs = require('fs');

function copyScopeTranslationFiles(files, scopeDir) {
  insertPathToGitIgnore(scopeDir);
  // TODO: Use `for of` when you don't need the index. It's cleaner and you don't need a callback
  files.forEach(filePath => {
    // TODO: anti pattern to override a callback param
    filePath = path.normalize(filePath);
    const fileName = path.basename(filePath);
    const dest = path.join(scopeDir, fileName);

    if (fs.existsSync(dest)) {
      mergeTranslationFile(filePath, dest);
    } else {
      fs.copyFileSync(filePath, dest);
    }
  });
}

function mergeTranslationFile(file, dest) {
  // TODO: Why merge? the single source of truth is the origin file
  const originContent = JSON.parse(fs.readFileSync(dest, 'utf8') || '{}');
  const destContent = JSON.parse(fs.readFileSync(file, 'utf8') || '{}');
  fs.writeFileSync(dest, JSON.stringify({ ...originContent, ...destContent }, null, 2), { encoding: 'utf8' });
}

function insertPathToGitIgnore(input) {
  const gitIgnorePath = path.resolve('.gitignore');
  const normalize = toLinuxFormat(input.split(process.cwd())[1]);
  let gitIgnore = fs.readFileSync(gitIgnorePath, 'utf8');
  if (gitIgnore.indexOf(normalize) === -1) {
    gitIgnore = `${gitIgnore}\n${normalize}`;
    fs.writeFileSync(gitIgnorePath, gitIgnore);
  }
}

function toLinuxFormat(p) {
  return p.split(path.sep).join('/');
}

module.exports = copyScopeTranslationFiles;
