export interface TranslocoGlobalConfig {
  rootTranslationsPath?: string;
  defaultLang?: string;
  scopedLibs?: string[] | Array<{ src: string; dist: string[] }>;
  scopePathMap?: Record<string, string>;
  langs?: string[];
  keysManager?: {
    input?: string | string[];
    output?: string;
    fileFormat?: 'json' | 'pot';
    marker?: string;
    addMissingKeys?: boolean;
    emitErrorOnExtraKeys?: boolean;
    replace?: boolean;
    defaultValue?: string | undefined;
    unflat?: boolean;
  };
}
