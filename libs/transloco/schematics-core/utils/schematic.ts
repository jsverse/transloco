import { inspect } from 'node:util';

import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';

export const NAMES = {
  LIB_NAME: '@jsverse/transloco',
  CONFIG_FILE: 'transloco.config.ts',
};

export function generateConfigFile(config: TranslocoGlobalConfig) {
  return `import {TranslocoGlobalConfig} from '@jsverse/transloco-utils';
    
const config: TranslocoGlobalConfig = ${inspect(config)};
    
export default config;`;
}
