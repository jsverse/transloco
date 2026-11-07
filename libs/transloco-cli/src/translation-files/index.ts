// Internal entry point for the `join` and `split` schematics. Not a public API.
export { joinTranslations, type JoinOptions } from './join';
export { splitTranslations, type SplitOptions } from './split';
export {
  findTranslationFiles,
  TranslationFilesError,
  type PlannedFile,
  type TranslationFileReader,
} from './shared';
