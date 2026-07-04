import { defineNodeProject } from '../../tools/vitest/define-project';

export default defineNodeProject({
  name: 'schematics-core',
  root: __dirname,
  coverageDir: '../../coverage/libs/schematics-core',
});
