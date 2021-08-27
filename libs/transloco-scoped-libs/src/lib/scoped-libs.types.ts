import { TranslocoGlobalConfig } from '@ngneat/transloco-utils';

type ScopeStrategy = 'join' | 'default';

export interface ScopedLibsOptions
  extends Pick<TranslocoGlobalConfig, 'rootTranslationsPath' | 'scopedLibs'> {
  watch: boolean;
  skipGitIgnoreUpdate: boolean;
}

export interface CopyScopeOptions {
  outputDir: string;
  scope: string;
  files: string[];
  strategy: ScopeStrategy;
  skipGitIgnoreUpdate?: boolean;
}

export interface SetTranslationOptions
  extends Pick<CopyScopeOptions, 'strategy' | 'scope'> {
  translationFilePath: string;
  outputFilePath: string;
}

export interface CopyScopeTranslationsOptions extends CopyScopeOptions {
  fileExtention: `${string}json`;
}
