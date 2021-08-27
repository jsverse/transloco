import {getGlobalConfig, TranslocoGlobalConfig} from "@ngneat/transloco-utils";

let config: TranslocoGlobalConfig;

export function getConfig(): TranslocoGlobalConfig {
  if (config) return config;
  config = getGlobalConfig();

  return config;
}
