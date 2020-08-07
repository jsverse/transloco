const { buildCliProject } = require('./helpers');

const projectName = process.argv[2].replace('--project=', '');
switch (projectName) {
  case 'remove-comments':
    buildCliProject('remove-comments', [{ name: 'test.js' }]);
    break;
  default:
    buildCliProject(projectName);
}
