const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function resolvePath(project, root = 'dist') {
  return path.resolve(process.cwd(), `${root}/ngneat/transloco-${project}`);
}

function cleanDist(project) {
  const dir = resolvePath(project);
  fs.existsSync(dir) && fs.rmdirSync(dir, { recursive: true });
}

function copyProject(project) {
  const origin = resolvePath(project, 'projects');
  const dist = origin.replace('projects', 'dist');
  execSync(`cp -r ${origin} ${dist}`);
}

function removeUnnecessaryFiles(project, removePaths = []) {
  const path = resolvePath(project);
  fs.rmdirSync(`${path}/node_modules`, { recursive: true });
  for (const { name, isDir } of removePaths) {
    if (isDir) {
      fs.rmdirSync(`${path}/${name}`, { recursive: true });
    } else {
      fs.unlinkSync(`${path}/${name}`);
    }
  }
}

function buildCliProject(project, removePaths) {
  cleanDist(project);
  copyProject(project);
  removeUnnecessaryFiles(project, removePaths);
}

module.exports = {
  buildCliProject
};
