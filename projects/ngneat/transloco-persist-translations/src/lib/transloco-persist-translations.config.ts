export type TranslocoPersistTranslationsConfig = {
  // TODO: change propName to ttl
  lifeTime?: number;
  storageKey?: string;
};

export const defaultConfig: TranslocoPersistTranslationsConfig = {
  lifeTime: 86400, // One day
  storageKey: '@transloco/translations'
};
