export type Config = {
  input: string[];
  config: string;
  project: string;
  translationsPath: string;
  langs: string[];
  defaultValue: undefined | string;
  replace: boolean;
  addMissingKeys: boolean;
  removeExtraKeys: boolean;
  emitErrorOnExtraKeys: boolean;
  scopes: Scopes;
  scopePathMap?: {
    [scopeAlias: string]: string;
  };
  files: string[];
  output: string;
  marker: string;
  sort: boolean;
  unflat: boolean;
  command: 'extract' | 'find';
  fileFormat: FileFormats;
  /** @internal - Used for ${sourceRoot} interpolation in scopePathMap */
  __sourceRoot?: string;
};

export type FileFormats = 'json' | 'pot';
export type FileType = 'ts' | 'html';

export type ExtractionResult = {
  scopeToKeys: ScopeMap;
  fileCount: number;
};

export type ExtractorConfig = {
  file: string;
  scopes: Scopes;
  defaultValue?: string;
  scopeToKeys: ScopeMap;
};

export type Scopes = {
  // scope/path => scopePath
  scopeToAlias: {
    [scope: string]: string;
  };
  // scopePath => scope/path
  aliasToScope: {
    [scopeAlias: string]: string;
  };
};

export type ScopeMap = {
  __global: Record<string, string>;
  [scopePath: string]: Record<string, string>;
};

export enum TEMPLATE_TYPE {
  STRUCTURAL,
  NG_TEMPLATE,
}

export type BaseParams = {
  defaultValue?: string;
  scopeToKeys: ScopeMap;
  scopes: Scopes;
};

export type Translation = Record<string, any>;
export type OrArray<T> = T | T[];
