import { inspect } from 'node:util';

import type { TranslocoGlobalConfig } from '@jsverse/transloco-cli';

export const NAMES = {
  LIB_NAME: '@jsverse/transloco',
  CONFIG_FILE: 'transloco.config.ts',
};

export function generateConfigFile(config: TranslocoGlobalConfig) {
  return `import type { TranslocoGlobalConfig } from '@jsverse/transloco';
    
const config: TranslocoGlobalConfig = ${inspect(config)};
    
export default config;`;
}
