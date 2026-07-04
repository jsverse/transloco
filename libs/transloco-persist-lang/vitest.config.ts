import { defineAngularProject } from '../../tools/vitest/define-project';

export default defineAngularProject({
  name: 'transloco-persist-lang',
  root: __dirname,
  coverageDir: '../../coverage/libs/transloco-persist-lang',
  // These specs install spies in `beforeAll` and rely on them persisting across
  // the block's tests (Jasmine treated beforeAll spies as suite-lived). Opt out
  // of the base's restoreMocks so Vitest doesn't restore them before each test.
  restoreMocks: false,
});
