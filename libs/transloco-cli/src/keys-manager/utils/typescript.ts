import { createRequire } from 'node:module';

/**
 * The TypeScript compiler API, for every module of the keys manager.
 *
 * `typescript` is a single CommonJS file of several megabytes. An `import` of
 * it has Node scan the whole file for the names it exports before running it,
 * which a `require` doesn't.
 */
const ts: typeof import('typescript') = createRequire(import.meta.url)(
  'typescript',
);

export default ts;
