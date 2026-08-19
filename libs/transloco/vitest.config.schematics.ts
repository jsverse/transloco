import { defineNodeProject } from '../../tools/vitest/define-project';

export default defineNodeProject({
  name: 'transloco-schematics-spec',
  root: __dirname,
  include: ['schematics/**/*.spec.ts', 'migrations/**/*.spec.ts'],
  setupFiles: ['../../tools/vitest/setup-schematics.ts'],
  coverageDir: '../../coverage/libs/transloco-schematics-spec',
  coverageInclude: ['schematics/**/*.ts', 'migrations/**/*.ts'],
  coverageExclude: ['schematics/**/*.spec.ts', 'migrations/**/*.spec.ts'],
});
