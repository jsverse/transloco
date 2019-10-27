export interface TranslocoConfig {
  rootTranslationsPath?: string;
  defaultLang?: string;
  scopePathMap?: { [key: string]: string };
  langs?: string[];
  keysManager?: {
    addMissingKeys?: boolean;
    replace?: boolean;
    defaultValue?: string | undefined;
  };
}
