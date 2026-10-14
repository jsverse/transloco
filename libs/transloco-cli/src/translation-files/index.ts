// Internal entry point for the `join` and `split` schematics. Not a public API.
export { joinTranslations, type JoinOptions } from './join.js';
export { splitTranslations, type SplitOptions } from './split.js';
export {
  findTranslationFiles,
  TranslationFilesError,
  type PlannedFile,
  type TranslationFileReader,
} from './shared.js';
