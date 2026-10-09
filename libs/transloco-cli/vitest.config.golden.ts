import { defineNodeProject } from '../../tools/vitest/define-project.js';

// The specs under `tests/` run the built binary, so they are kept out of the
// unit test run and get a target of their own that builds first.
export default defineNodeProject({
  name: 'transloco-cli-golden',
  root: import.meta.dirname,
  coverageDir: '../../coverage/libs/transloco-cli-golden',
  include: ['tests/**/*.spec.ts'],
});
