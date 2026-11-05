import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

describe('transloco bin', () => {
  it(`GIVEN the scaffolded bin stub
      WHEN it is executed
      THEN it reports that the commands are not wired and exits with code 1`, () => {
    const { status, stdout, stderr } = spawnSync(
      process.execPath,
      ['--no-warnings', path.join(__dirname, 'bin.ts')],
      { encoding: 'utf-8' },
    );

    expect(status).toBe(1);
    expect(stderr).toContain('transloco CLI: commands are not wired yet');
    expect(stdout).toBe('');
  });
});
