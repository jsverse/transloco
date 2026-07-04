import { defineNodeProject } from '../../tools/vitest/define-project';

export default defineNodeProject({
  name: 'transloco-utils',
  root: __dirname,
  coverageDir: '../../coverage/libs/transloco-utils',
});
