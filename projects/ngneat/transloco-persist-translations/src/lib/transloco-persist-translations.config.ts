export type TranslocoPersistTranslationsConfig = {
  ttl?: number;
  storageKey?: string;
};

export const defaultConfig: TranslocoPersistTranslationsConfig = {
  ttl: 86400, // One day
  storageKey: '@transloco/translations'
};
