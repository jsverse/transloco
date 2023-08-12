export type HashMap<T = any> = Record<string, T>;

export interface LoadedEvent {
  type: 'translationLoadSuccess';
  wasFailure: boolean;
  payload: {
    scope: string | null;
    langName: string;
  };
}

export interface FailedEvent {
  type: 'translationLoadFailure';
  payload: LoadedEvent['payload'];
}

export interface LangChangedEvent {
  type: 'langChanged';
  payload: LoadedEvent['payload'];
}

export type TranslocoEvents = LoadedEvent | FailedEvent | LangChangedEvent;
export type Translation = HashMap;
export type TranslateParams = string | string[];
export type TranslateObjectParams =
  | TranslateParams
  | HashMap
  | Map<string, HashMap>;
export interface LangDefinition {
  id: string;
  label: string;
}
export type AvailableLangs = string[] | LangDefinition[] | null;
export interface SetTranslationOptions {
  merge?: boolean;
  emitChange?: boolean;
}
export interface ProviderScope {
  scope: string;
  loader?: InlineLoader;
  alias?: string;
}
export type OrArray<T> = T | T[];
export type TranslocoScope = ProviderScope | string | undefined;
export type InlineLoader = HashMap<() => Promise<Translation>>;
export interface LoadOptions {
  fallbackLangs?: string[] | null;
  /** @internal */
  failedCounter?: number;
  inlineLoader?: InlineLoader;
}
