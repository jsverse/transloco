import { inspect } from 'node:util';

export const NAMES = {
  LIB_NAME: '@jsverse/transloco',
  CONFIG_FILE: 'transloco.config.ts',
};

/**
 * What the schematics put in a new config file. The generated file types it as
 * `TranslocoGlobalConfig` from `@jsverse/transloco`, which the schematics can't
 * import: this folder is compiled to CommonJS, outside the package's own build.
 */
interface GeneratedConfig {
  rootTranslationsPath?: string;
  langs?: string[];
  keysManager?: Record<string, never>;
}

export function generateConfigFile(config: GeneratedConfig) {
  return `import type { TranslocoGlobalConfig } from '@jsverse/transloco';

const config: TranslocoGlobalConfig = ${inspect(config)};

export default config;`;
}
