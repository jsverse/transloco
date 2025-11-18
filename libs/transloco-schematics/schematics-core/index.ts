export { stringifyList, coerceArray } from './utils/collections';
export { addScriptToPackageJson } from './utils/package';
export {
  getProject,
  setEnvironments,
  getWorkspace,
  setWorkspace,
} from './utils/workspace';
export {
  createGlobalConfig,
  getGlobalConfig,
  updateGlobalConfig,
} from './utils/transloco';
export {
  createTranslateFiles,
  checkIfTranslationFilesExist,
} from './utils/translation';

export {
  getTranslationEntryPaths,
  getTranslationFiles,
  getTranslationKey,
  getTranslationsRoot,
  createTranslateFilesFromOptions,
} from './utils/translation';
export {
  hasFiles,
  hasSubdirs,
  getJsonFileContent,
  writeToJson,
} from './utils/file';
export { NAMES } from './utils/schematic';
export { findModuleFromOptions } from './utils/find-module';
