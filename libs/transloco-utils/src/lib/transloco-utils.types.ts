/**
 * Superseded by the `TranslocoGlobalConfig` type of `@jsverse/transloco`, import
 * it from there instead. `@jsverse/transloco-utils` keeps working but will not
 * change, and will be deprecated in Transloco v10.
 */
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
    sort?: boolean;
  };
}
