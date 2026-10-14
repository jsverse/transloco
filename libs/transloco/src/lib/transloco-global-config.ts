/**
 * The shape of `transloco.config.ts`, the file the Transloco tooling reads:
 * the schematics, `@jsverse/transloco-cli` and the keys manager.
 *
 * Type-only: import it with `import type` so Node's type stripping erases it
 * when the CLI loads the config.
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
