import { TranslocoConfig } from '@ngneat/transloco';

export function mergeConfig(defaultConfig: TranslocoConfig, userConfig: Partial<TranslocoConfig>) {
  return {
    ...defaultConfig,
    ...userConfig,
    missingHandler: {
      ...defaultConfig.missingHandler,
      ...userConfig.missingHandler
    },
    flatten: {
      ...defaultConfig.flatten,
      ...userConfig.flatten
    }
  };
}
