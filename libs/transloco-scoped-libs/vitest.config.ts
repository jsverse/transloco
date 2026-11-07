import { defineNodeProject } from '../../tools/vitest/define-project.js';

export default defineNodeProject({
  name: 'transloco-scoped-libs',
  root: import.meta.dirname,
  setupFiles: ['src/test-setup.ts'],
  coverageDir: '../../coverage/libs/transloco-scoped-libs',
});
