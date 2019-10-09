import { Observable } from 'rxjs';

export type HashMap<T = any> = { [key: string]: T };

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
export type PersistStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type TranslateParams = string | string[];
export type AvailableLangs = string[] | { id: string; label: string }[];
export type SetTranslationOptions = { merge?: boolean; emitChange?: boolean };
export type InlineLoader = () => HashMap<Observable<Translation> | Promise<Translation>>;
