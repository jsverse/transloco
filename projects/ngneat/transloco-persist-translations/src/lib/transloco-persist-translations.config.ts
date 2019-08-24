export type TranslocoPersistTranslationsConfig = {
  // TODO: change propName to ttl
  ttl?: number;
  storageKey?: string;
};

export const defaultConfig: TranslocoPersistTranslationsConfig = {
  ttl: 86400, // One day
  storageKey: '@transloco/translations'
};
