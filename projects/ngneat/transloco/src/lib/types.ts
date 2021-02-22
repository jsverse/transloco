export type HashMap<T = any> = { [key: string]: T };

export type LoadedEvent = {
  type: 'translationLoadSuccess';
  wasFailure: boolean;
  payload: {
    scope: string | null;
    langName: string;
    /** @deprecated */
    lang: string;
  };
};

export type FailedEvent = {
  type: 'translationLoadFailure';
  payload: LoadedEvent['payload'];
};

export type TranslocoEvents = LoadedEvent | FailedEvent;
export type Translation = HashMap;
export type PersistStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type TranslateParams = string | string[];
export type TranslateObjectParams = TranslateParams | HashMap | Map<string, HashMap>;
export type AvailableLangs = string[] | { id: string; label: string }[];
export type SetTranslationOptions = { merge?: boolean; emitChange?: boolean };
export type ProviderScope = {
  scope: string;
  loader?: InlineLoader;
  alias?: string;
};
export type MaybeArray<T> = T | T[];
export type TranslocoScope = ProviderScope | string | undefined;
export type InlineLoader = HashMap<() => Promise<Translation>>;
export type LoadOptions = {
  fallbackLangs?: string[] | null;
  /** @internal */
  failedCounter?: number;
  inlineLoader?: InlineLoader | null;
};
