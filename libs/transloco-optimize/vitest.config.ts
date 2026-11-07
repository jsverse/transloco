import { defineNodeProject } from '../../tools/vitest/define-project.js';

export default defineNodeProject({
  name: 'transloco-optimize',
  root: import.meta.dirname,
  coverageDir: '../../coverage/libs/transloco-optimize',
});
