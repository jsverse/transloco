// Internal entry point for the `@jsverse/transloco-keys-manager` bin. Not a public API.
export { optionDefinitions, sections } from './cli-options.js';
export { buildTranslationFiles } from './keys-builder/index.js';
export { findMissingKeys } from './keys-detective/index.js';
export type { Config } from './types.js';
export { warnUnsupportedOptions } from './utils/warn-unsupported-options.js';
