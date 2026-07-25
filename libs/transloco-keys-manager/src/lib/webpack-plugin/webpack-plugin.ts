import { buildTranslationFiles } from '../keys-builder';
import { buildTranslationFile } from '../keys-builder/build-translation-file';
import { extractTemplateKeys } from '../keys-builder/template';
import { extractTSKeys } from '../keys-builder/typescript';
import { Config, ScopeMap, FileType } from '../types';
import { initExtraction } from '../utils/init-extraction';
import { mergeDeep } from '../utils/object.utils';
import { buildScopeFilePaths } from '../utils/path.utils';
import { resolveConfig } from '../utils/resolve-config';
import { updateScopesMap } from '../utils/update-scopes-map';

import { generateKeys } from './generate-keys';

let init = true;

export class TranslocoExtractKeysWebpackPlugin {
  config: Config;

  constructor(inlineConfig: Partial<Config> = {}) {
    this.config = resolveConfig(inlineConfig);
  }

  apply(compiler: any) {
    compiler.hooks.watchRun.tapPromise(
      'TranslocoExtractKeysPlugin',
      async (comp: any) => {
        if (init) {
          init = false;
          return buildTranslationFiles(this.config);
        }

        const keysExtractions: Record<FileType, string[]> = {
          html: [],
          ts: [],
        };
        const files =
          comp.modifiedFiles ||
          Object.keys(comp.watchFileSystem.watcher.mtimes);

        for (const file of files) {
          const fileType = resolveFileType(file);

          if (fileType) {
            keysExtractions[fileType].push(file);
          }
        }

        if (keysExtractions.html.length || keysExtractions.ts.length) {
          let htmlResult = initExtraction();
          let tsResult = initExtraction();
          if (keysExtractions.ts.length) {
            // Maybe someone added a TRANSLOCO_SCOPE
            const newScopes = updateScopesMap({ files: keysExtractions.ts });

            const paths = buildScopeFilePaths({
              aliasToScope: newScopes,
              langs: this.config.langs,
              output: this.config.output,
              fileFormat: this.config.fileFormat,
            });

            paths.forEach(({ path }) =>
              buildTranslationFile({
                path,
                fileFormat: this.config.fileFormat,
              }),
            );
            tsResult = extractTSKeys({
              ...this.config,
              files: keysExtractions.ts,
            });
          }

          if (keysExtractions.html.length) {
            htmlResult = extractTemplateKeys({
              ...this.config,
              files: keysExtractions.html,
            });
          }

          const scopeToKeys = mergeDeep(
            {},
            htmlResult.scopeToKeys,
            tsResult.scopeToKeys,
          ) as ScopeMap;
          const hasTranslateKeys = Object.keys(scopeToKeys).some(
            (key) => Object.keys(scopeToKeys[key]).length > 0,
          );

          if (hasTranslateKeys) {
            generateKeys({
              config: this.config,
              translationPath: this.config.translationsPath,
              scopeToKeys,
            });
          }
        }

        return Promise.resolve();
      },
    );
  }
}

function resolveFileType(file: string): FileType | null {
  return isHtml(file) ? 'html' : isTs(file) ? 'ts' : null;
}

function isHtml(file: string) {
  return file.endsWith('.html');
}

function isTs(file: string) {
  return file.endsWith('.ts') && !file.endsWith('.spec.ts');
}
