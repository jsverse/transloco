import { defineAngularProject } from '../../tools/vitest/define-project';

export default defineAngularProject({
  name: 'transloco',
  root: __dirname,
  include: ['src/lib/**/*.spec.ts'],
  coverageDir: '../../coverage/libs/transloco',
});
