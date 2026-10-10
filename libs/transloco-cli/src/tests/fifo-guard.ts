import fs from 'node:fs';

import { vi } from 'vitest';

/**
 * Opening a FIFO waits for the other end, and reading `/dev/zero` never ends.
 * Both block the process itself, which no timeout of a test can interrupt. So
 * the calls that would open such a path throw instead, which makes a test fail
 * where it would hang. The path is only looked at, links followed.
 *
 * To be called from a `beforeEach`, `vi.restoreAllMocks()` undoes it.
 */
export function refuseToOpenWhatIsNoFile() {
  const stat = fs.statSync;
  const waits = (file: unknown) => {
    try {
      if (typeof file !== 'string') return false;

      const stats = stat(file);

      return !stats.isFile() && !stats.isDirectory();
    } catch {
      return false;
    }
  };

  for (const name of ['readFileSync', 'openSync', 'writeFileSync'] as const) {
    const original = fs[name] as (...args: unknown[]) => unknown;

    vi.spyOn(fs, name).mockImplementation(((
      file: unknown,
      ...rest: unknown[]
    ) => {
      if (waits(file)) {
        throw new Error(`would open ${String(file)}, which is no file`);
      }

      return original(file, ...rest);
    }) as never);
  }
}
