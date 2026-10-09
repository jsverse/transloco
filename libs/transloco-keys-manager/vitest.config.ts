import { defineNodeProject } from '../../tools/vitest/define-project.js';

export default defineNodeProject({
  name: 'transloco-keys-manager',
  root: import.meta.dirname,
  coverageDir: '../../coverage/libs/transloco-keys-manager',
});
