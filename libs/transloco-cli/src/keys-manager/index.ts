// Internal entry point for the `@jsverse/transloco-keys-manager` bin. Not a public API.
export { optionDefinitions, sections } from './cli-options';
export { buildTranslationFiles } from './keys-builder';
export { findMissingKeys } from './keys-detective';
export type { Config } from './types';
export { warnUnsupportedOptions } from './utils/warn-unsupported-options';
