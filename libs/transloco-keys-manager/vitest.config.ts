import { defineNodeProject } from '../../tools/vitest/define-project';

export default defineNodeProject({
  name: 'transloco-keys-manager',
  root: __dirname,
  coverageDir: '../../coverage/libs/transloco-keys-manager',
});
