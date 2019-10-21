export interface TranslocoConfig {
  rootTranslationsPath?: string;
  scopePathMap?: { [key: string]: string };
  langs?: string[];
  keysManager?: {
    addMissingKeys?: boolean;
    replace?: boolean;
    defaultValue?: string | undefined;
  };
}
