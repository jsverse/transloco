import { defineNodeProject } from '../../tools/vitest/define-project.js';

export default defineNodeProject({
  name: 'transloco-validator',
  root: import.meta.dirname,
  coverageDir: '../../coverage/libs/transloco-validator',
});
