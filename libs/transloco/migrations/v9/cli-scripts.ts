import { posix } from 'node:path';

import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { LegacyBin } from './cli-scripts-table';
import {
  mentionsBin,
  stillRunsBin,
  translateScript,
} from './cli-scripts-translate';
import { addCliDependency, CLI_PACKAGE } from './import-utils';
import { collectMatching } from './workspace-utils';

/** A script of a `package.json`, and the span of its value in the file. */
interface ScriptEntry {
  name: string;
  value: string;
  start: number;
  end: number;
}

class NotJson extends Error {}

/**
 * Finds the string values of the top-level `scripts` of a `package.json`
 * together with where they stand, so that one can be replaced without the file
 * being written out again.
 *
 * @returns `null` when the file isn't a JSON object
 */
export function findScripts(source: string): ScriptEntry[] | null {
  // A byte order mark counts as a blank for `\s`, so it is skipped with the rest
  let index = 0;
  let scripts: ScriptEntry[] = [];

  const skipBlanks = () => {
    while (/\s/.test(source[index] ?? '')) index++;
  };
  const expect = (char: string) => {
    skipBlanks();
    if (source[index] !== char) throw new NotJson();
    index++;
  };
  const readString = () => {
    const start = index;

    if (source[index] !== '"') throw new NotJson();

    for (index++; index < source.length; index++) {
      if (source[index] === '\\') index++;
      else if (source[index] === '"') break;
    }

    if (index >= source.length) throw new NotJson();

    index++;

    return {
      start,
      end: index,
      value: JSON.parse(source.slice(start, index)) as string,
    };
  };
  /** Reads the object or the array at `index`, handing every member of an object to `onMember`. */
  const readContainer = (
    onMember?: (key: string, valueStart: number) => void,
  ) => {
    const close = source[index] === '{' ? '}' : ']';

    index++;
    skipBlanks();

    if (source[index] === close) {
      index++;

      return;
    }

    while (true) {
      skipBlanks();

      let key = '';

      if (close === '}') {
        key = readString().value;
        expect(':');
        skipBlanks();
      }

      onMember?.(key, index);
      readValue();
      skipBlanks();

      if (source[index] === ',') {
        index++;
      } else {
        return expect(close);
      }
    }
  };
  const readValue = () => {
    skipBlanks();

    const char = source[index];

    if (char === '{' || char === '[') return readContainer();
    if (char === '"') return readString();

    const literal = /^[^\s,\]}]+/.exec(source.slice(index));

    if (!literal) throw new NotJson();

    index += literal[0].length;
  };

  try {
    skipBlanks();

    if (source[index] !== '{') return null;

    readContainer((key, valueStart) => {
      if (key !== 'scripts' || source[valueStart] !== '{') return;

      // The last of two `scripts` is the one a JSON parser keeps
      scripts = [];
      index = valueStart;
      readContainer((name, memberStart) => {
        if (source[memberStart] !== '"') return;

        const entry = readString();

        scripts.push({ name, ...entry });
        // The container reads the member once more, as a value
        index = memberStart;
      });
      // and so it does with `scripts` itself
      index = valueStart;
    });

    skipBlanks();

    return index === source.length ? scripts : null;
  } catch (error) {
    if (error instanceof NotJson || error instanceof SyntaxError) return null;

    throw error;
  }
}

/** Files that run commands and that are not read: a mention of a bin there is reported, never edited. */
const COMMAND_FILES = [
  /(^|\/)\.github\/workflows\/[^/]+\.ya?ml$/,
  /(^|\/)\.gitlab-ci\.ya?ml$/,
  /(^|\/)azure-pipelines\.ya?ml$/,
  /(^|\/)Jenkinsfile$/,
  /(^|\/)Makefile$/,
  /\.sh$/,
  /(^|\/)(project|\.?angular)\.json$/,
  /(^|\/)\.circleci\/config\.ya?ml$/,
  /(^|\/)bitbucket-pipelines\.ya?ml$/,
  // The hooks sit right in the folder, `.husky/_` holds the ones husky generates
  /(^|\/)\.husky\/[^/]+$/,
  /(^|\/)\.lintstagedrc[^/]*$/,
  /(^|\/)lint-staged\.config\.[^/]+$/,
  /(^|\/)Dockerfile[^/]*$/,
  /(^|\/)docker-compose[^/]*\.ya?ml$/,
  /(^|\/)Taskfile\.ya?ml$/,
  /(^|\/)[Jj]ustfile$/,
];

/** The hooks husky generates, which are not the user's: only the ones right in `.husky` are. */
const GENERATED = /(^|\/)\.husky\/_\//;

const isManifest = (path: string) =>
  /(^|\/)package\.json$/.test(path) && !/\/\.[^/]+\//.test(path);

interface Moved {
  path: string;
  name: string;
}

interface Kept extends Moved {
  reason: string;
}

const STILL_USED =
  'the old bin is still used here and could not be rewritten automatically';

/**
 * Whether `path`, as a script of the `package.json` at `manifest` writes it,
 * is a file or a folder of the tree. A script runs in the folder of its
 * `package.json`. `undefined` for a path that leaves the workspace.
 */
function pathChecker(tree: Tree, manifest: string) {
  const base = posix.dirname(manifest).replace(/^\//, '');

  return (path: string) => {
    const joined = posix.join(base, path);

    if (joined === '..' || joined.startsWith('../')) return undefined;

    const absolute = `/${joined}`.replace(/\/$/, '') || '/';

    // A path that ends with a slash names a folder, whatever else is there
    if (!path.endsWith('/') && tree.exists(absolute)) return true;

    try {
      const dir = tree.getDir(absolute);

      return dir.subfiles.length > 0 || dir.subdirs.length > 0;
    } catch {
      return false;
    }
  };
}

const REPLACEMENTS = `'transloco extract', 'transloco find', 'transloco validate', 'transloco optimize' and 'transloco scoped-libs'`;

/**
 * Moves the npm scripts running a deprecated bin to the `transloco` bin of
 * `@jsverse/transloco-cli`.
 *
 * The scripts of every `package.json` in the workspace are read as shell
 * command lines, and each bin invocation in them is translated, option by
 * option, with the table the CLI project holds to the real program. A script
 * is only rewritten when every one of its invocations is understood to the
 * last token and has an equivalent on the new bin. The others are left as
 * they are and reported, with the reason. So is a script that still names a
 * bin once it was read, in a shape this migration doesn't parse.
 *
 * A `--config` path is looked up in the tree, from the folder of the
 * `package.json` that holds the script: the new bin stops on a path that does
 * not exist, the old one ignored it.
 *
 * Only the text of the scripts changes in a `package.json`. Other files that
 * run the bins, the CI pipelines and the like, are reported and never edited.
 *
 * The legacy packages stay in `package.json`: a script that wasn't moved may
 * still need them.
 */
export function migrateCliScripts(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const moved: Moved[] = [];
    const kept: Kept[] = [];
    const bins = new Set<LegacyBin>();
    const others: string[] = [];

    const files = collectMatching(
      tree,
      (path) =>
        !GENERATED.test(path) &&
        (isManifest(path) || COMMAND_FILES.some((file) => file.test(path))),
    );

    for (const path of files) {
      const source = tree.read(path)?.toString();

      if (!source) continue;

      if (!isManifest(path)) {
        if (mentionsBin(source)) others.push(path);

        continue;
      }

      const edits: Array<{ start: number; end: number; text: string }> = [];
      const pathExists = pathChecker(tree, path);

      for (const script of findScripts(source) ?? []) {
        const result = translateScript(script.value, { pathExists });

        if (result.kind === 'left') {
          kept.push({ path, name: script.name, reason: result.reason });
        } else if (
          stillRunsBin(
            result.kind === 'rewritten' ? result.script : script.value,
          )
        ) {
          // A shape that wasn't read: the script stays whole, even if a part of it could move
          kept.push({ path, name: script.name, reason: STILL_USED });
        } else if (result.kind === 'rewritten') {
          edits.push({
            start: script.start,
            end: script.end,
            text: JSON.stringify(result.script),
          });
          moved.push({ path, name: script.name });
          result.bins.forEach((bin) => bins.add(bin));
        }
      }

      if (edits.length) {
        let content = source;

        for (const edit of edits.sort((a, b) => b.start - a.start)) {
          content =
            content.slice(0, edit.start) + edit.text + content.slice(edit.end);
        }

        tree.overwrite(path, content);
      }
    }

    if (moved.length) {
      context.logger.info(
        `  ↳ Moved ${moved.length} npm script(s) to the 'transloco' bin of '${CLI_PACKAGE}':\n` +
          moved.map(({ path, name }) => `    - ${path}: ${name}`).join('\n'),
      );
    }

    if (bins.has('transloco-optimize')) {
      context.logger.info(
        `  ↳ 'transloco optimize' exits with code 1 when it fails, where 'transloco-optimize' exited with 0.` +
          `\n    A pipeline that went on after a failed optimize stops now.`,
      );
    }

    if (kept.length) {
      context.logger.warn(
        `  ↳ ${kept.length} npm script(s) run a deprecated bin in a way that has no safe translation, so they were left as they are:\n` +
          kept
            .map(
              ({ path, name, reason }) => `    - ${path}: ${name}: ${reason}`,
            )
            .join('\n') +
          `\n    Replace the bin by hand: ${REPLACEMENTS}.`,
      );
    }

    if (others.length) {
      context.logger.warn(
        `  ↳ These files run a deprecated bin and were not edited:\n` +
          others.map((path) => `    - ${path}`).join('\n') +
          `\n    Replace the bin by hand: ${REPLACEMENTS}.`,
      );
    }

    if (moved.length) {
      context.logger.info(
        `  ↳ The packages of the deprecated bins are still in your dependencies. Remove them once nothing runs their bins anymore.`,
      );

      addCliDependency(
        tree,
        context,
        `npm scripts in your workspace run its 'transloco' bin now`,
      );
    }
  };
}
