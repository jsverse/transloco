export type HashMap<T = string> = { [key: string]: T };

export type LoadedEvent = {
  type: 'translationLoadSuccess';
  wasFailure: boolean;
  payload: {
    lang: string;
  };
};

export type FailedEvent = {
  type: 'translationLoadFailure';
  payload: {
    lang: string;
  };
};

export type TranslocoEvents = LoadedEvent | FailedEvent;
export type Translation = HashMap<any>;
export type TranslationCb<T> = (translation: T, params?: HashMap) => string;
export type PersisStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
