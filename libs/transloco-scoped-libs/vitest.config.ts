import { defineNodeProject } from '../../tools/vitest/define-project';

export default defineNodeProject({
  name: 'transloco-scoped-libs',
  root: __dirname,
  setupFiles: ['src/test-setup.ts'],
  coverageDir: '../../coverage/libs/transloco-scoped-libs',
});
