export type HashMap<T = string> = { [key: string]: T };

export type LoadedEvent = {
  type: 'translationLoadSuccess';
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
