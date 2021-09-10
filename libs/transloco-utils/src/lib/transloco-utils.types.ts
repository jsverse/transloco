export interface TranslocoGlobalConfig {
  rootTranslationsPath?: string;
  defaultLang?: string;
  scopedLibs?: string[];
  scopePathMap?: Record<string, string>;
  langs?: string[];
  keysManager?: {
    input?: string | string[];
    output?: string;
    marker?: string;
    addMissingKeys?: boolean;
    replace?: boolean;
    defaultValue?: string;
  };
}
