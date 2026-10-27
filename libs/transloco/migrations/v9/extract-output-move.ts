import { posix } from 'node:path';

import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { collectMatching, getProjects } from './workspace-utils';

const CONFIG_FILE =
  /(^|\/)(transloco\.config\.([cm]?[jt]s|json)|\.translocorc(\.(json|ya?ml|[cm]?[jt]s))?)$/;

/** `output` as a key, in any config format, which pins where `extract` writes. */
const OUTPUT_KEY = /["']?\boutput["']?\s*[:=]/;

const ROOT_TRANSLATIONS_PATH =
  /["']?\brootTranslationsPath["']?\s*[:=]\s*["'`]([^"'`]+)["'`]/;

const normalize = (path: string) =>
  posix
    .normalize(path)
    .replace(/^(\.\/|\/)+/, '')
    .replace(/\/+$/, '');

/**
 * Tells about the folder `transloco extract` writes to now.
 *
 * Without `--output` and `keysManager.output` the 8.x keys manager wrote to
 * `<source root>/assets/i18n`, and `extract` writes to `rootTranslationsPath`
 * now. The change only shows for a project that has translation files in the
 * old folder while the config points `rootTranslationsPath` somewhere else,
 * so that is when it is reported. Nothing is edited: pinning the old folder
 * would keep `extract` and `find` apart for the projects the change is for.
 *
 * The config is read as text, as it may be a script. A config that sets no
 * `rootTranslationsPath`, or one that sets `output`, is left out.
 */
export function reportExtractOutputMove(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const configs = collectMatching(tree, (path) => CONFIG_FILE.test(path));
    const sourceRoots = new Set(
      getProjects(tree).map(({ sourceRoot }) => sourceRoot),
    );
    sourceRoots.add('/src');

    const moves = new Set<string>();

    for (const config of configs) {
      const source = tree.read(config)?.toString() ?? '';
      const target = ROOT_TRANSLATIONS_PATH.exec(source)?.[1];

      if (!target || OUTPUT_KEY.test(source)) continue;

      for (const sourceRoot of sourceRoots) {
        const old = normalize(`${sourceRoot}/assets/i18n`);

        if (old === normalize(target) || !hasJson(tree, old)) continue;

        moves.add(`${old} -> ${normalize(target)}`);
      }
    }

    if (!moves.size) return;

    context.logger.warn(
      `  ↳ 'transloco extract' writes to rootTranslationsPath now, where the 8.x keys manager wrote to <source root>/assets/i18n:\n` +
        [...moves].map((move) => `    - ${move}`).join('\n') +
        `\n    The old folder holds translation files. Set keysManager.output in your Transloco config, or pass --output, to keep writing there.`,
    );
  };
}

function hasJson(tree: Tree, dir: string) {
  try {
    return tree
      .getDir(`/${dir}`)
      .subfiles.some((file) => file.endsWith('.json'));
  } catch {
    return false;
  }
}
