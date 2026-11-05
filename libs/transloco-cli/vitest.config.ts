import { defineNodeProject } from '../../tools/vitest/define-project';

export default defineNodeProject({
  name: 'transloco-cli',
  root: __dirname,
  coverageDir: '../../coverage/libs/transloco-cli',
});
