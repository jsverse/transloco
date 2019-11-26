export interface TranslocoConfig {
  rootTranslationsPath?: string;
  defaultLang?: string;
  scopedLibs?: string[];
  scopePathMap?: { [key: string]: string };
  langs?: string[];
  keysManager?: {
    input?: string;
    output?: string;
    marker?: string;
    addMissingKeys?: boolean;
    replace?: boolean;
    defaultValue?: string | undefined;
  };
}
