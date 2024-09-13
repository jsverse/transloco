import { inspect } from 'node:util';

import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';

export const PROJECT_NAME = 'transloco';
export const NPM_SCOPE = '@jsverse';
export const LIB_NAME = `${NPM_SCOPE}/transloco`;
export const CONFIG_FILE = 'transloco.config.ts';

export function generateConfigFile(config: TranslocoGlobalConfig) {
  return `import {TranslocoGlobalConfig} from '@jsverse/transloco-utils';
    
const config: TranslocoGlobalConfig = ${inspect(config)};
    
export default config;`;
}
