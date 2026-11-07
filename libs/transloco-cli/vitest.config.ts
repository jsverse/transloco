import { defineNodeProject } from '../../tools/vitest/define-project.js';

export default defineNodeProject({
  name: 'transloco-cli',
  root: import.meta.dirname,
  coverageDir: '../../coverage/libs/transloco-cli',
  // The keys-manager specs install spies in `beforeAll` (e.g.
  // spyOnProcess('exit')) and rely on them persisting across the block's
  // tests. Opt out of the base's restoreMocks so Vitest doesn't restore them
  // before each test.
  restoreMocks: false,
});
