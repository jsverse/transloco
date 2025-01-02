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
export type AvailableLangs = string[] | LangDefinition[];
export interface SetTranslationOptions {
  lang?: string;
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

/** @internal */
declare global {
  // Indicates whether the application is operating in development mode.
  // `ngDevMode` is a global flag set by Angular CLI.
  // https://github.com/angular/angular-cli/blob/9b883fe28862c96720c7899b431174e9b47ad7e4/packages/angular/build/src/tools/esbuild/application-code-bundle.ts#L604
  const ngDevMode: boolean;
}
