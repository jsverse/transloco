import { describe, beforeAll, afterEach } from 'vitest';

import { resetScopes } from '../../keys-builder/utils/scope.utils';
import { spyOnConsole, spyOnProcess } from '../spec-utils';

import { testAddMissingKeysConfig } from './add-missing-keys/add-missing-keys-spec';

describe('findMissingKeys', () => {
  beforeAll(() => {
    spyOnConsole('warn');
    spyOnProcess('exit');
  });

  // Reset to ensure the scopes are not being shared among the tests.
  afterEach(() => resetScopes());

  testAddMissingKeysConfig();
});
