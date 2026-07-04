import { defineNodeProject } from '../../tools/vitest/define-project';

export default defineNodeProject({
  name: 'transloco-validator',
  root: __dirname,
  coverageDir: '../../coverage/libs/transloco-validator',
});
