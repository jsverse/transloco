import { defineNodeProject } from '../../tools/vitest/define-project';

export default defineNodeProject({
  name: 'transloco-keys-manager',
  root: __dirname,
  coverageDir: '../../coverage/libs/transloco-keys-manager',
  // These specs install spies in `beforeAll` (e.g. spyOnProcess('exit')) and
  // rely on them persisting across the block's tests. Opt out of the base's
  // restoreMocks so Vitest doesn't restore them before each test.
  restoreMocks: false,
});
