import { defineNodeProject } from '../../tools/vitest/define-project';

export default defineNodeProject({
  name: 'transloco-optimize',
  root: __dirname,
  coverageDir: '../../coverage/libs/transloco-optimize',
});
