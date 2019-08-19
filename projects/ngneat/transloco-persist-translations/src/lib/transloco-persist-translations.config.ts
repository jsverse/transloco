export type TranslocoPersistTranslationsConfig = {
  lifeTime?: number; // storage life time in seconds (e.g day = 86400)
  storageKey?: string;
};

export const defaultConfig: TranslocoPersistTranslationsConfig = {
  lifeTime: 86400,
  storageKey: '@transloco/translations'
};
