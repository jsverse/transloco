import { defineNodeProject } from '../../tools/vitest/define-project';

export default defineNodeProject({
  name: 'transloco-schematics',
  root: __dirname,
  // SchematicTestRunner raw-`require()`s schematic factories from
  // collection.json, bypassing Vitest's transform/alias pipeline. This setup
  // installs an SWC require hook so those `.ts` factories transpile and their
  // `@jsverse/*` path aliases resolve. See the setup file for the full rationale
  // (including why `vi.mock` can't reach the schematic).
  setupFiles: ['../../tools/vitest/setup-schematics.ts'],
  coverageDir: '../../coverage/libs/transloco-schematics',
});
