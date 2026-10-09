import baseConfig from '../../eslint.config.mjs';
import { relativeImportExtensions } from '../../tools/eslint/relative-import-extensions.mjs';

export default [...baseConfig, relativeImportExtensions];
