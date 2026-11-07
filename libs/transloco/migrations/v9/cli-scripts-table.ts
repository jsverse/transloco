/** What happens to an option, see CLI_SCRIPTS_TABLE. */
export type CliOutcome = 'same' | 'respelled' | 'dropped' | 'leave';

export interface CliOptionEntry {
  /** The long name on the new bin, or the legacy one when there is none. */
  name: string;
  spellings: Record<string, string | null>;
  outcome: CliOutcome;
  takesValue?: boolean;
  /** Takes several values, `--langs en es`, and may repeat. */
  variadic?: boolean;
  /** The only values the new bin accepts. */
  choices?: string[];
  /** The value can be empty, which the new bin rejects for every other option. */
  allowEmpty?: boolean;
  /** The value is a comma separated list that can't hold an empty part. */
  list?: boolean;
  /**
   * The value is a path the new bin stops on when nothing is there, where the
   * legacy bin carried on with the default configuration. A script is only
   * moved when the path is known to exist.
   */
  mustExist?: boolean;
  /** Why the option is dropped or left. */
  reason?: string;
}

export type LegacyBin =
  | 'transloco-keys-manager'
  | 'transloco-validator'
  | 'transloco-optimize'
  | 'transloco-scoped-libs';

export interface CliInvocation {
  bin: LegacyBin;
  /** The first argument of `transloco-keys-manager`, which stays where it is. */
  command?: 'extract' | 'find';
  /** What the bin, and only the bin, is replaced with. */
  to: string;
  /** What else the command takes: nothing, one or more files, or the `dist` folder. */
  positionals: 'none' | 'files' | 'dist';
  options: CliOptionEntry[];
}

export interface CliScriptsTable {
  invocations: CliInvocation[];
}

/**
 * What `ng update` needs to know to move an npm script from a deprecated bin
 * to the `transloco` bin of `@jsverse/transloco-cli`: for every invocation of
 * a legacy bin, each option it accepts and what the option becomes.
 *
 * Plain data, since core must not import the CLI. The `cli-scripts-table.spec.ts`
 * of the CLI project holds it to the real program by reading this file from
 * disk, which is why the literal below has to stay valid JSON.
 *
 * - `same`: written the same on the new bin.
 * - `respelled`: the same option under another name, see `spellings`.
 * - `dropped`: the legacy command accepted the option but never read it, so
 *   leaving it out changes nothing, and the new bin rejects it.
 * - `leave`: there is no spelling with the same result. A script using it is
 *   left alone and reported.
 *
 * `spellings` maps every way the legacy bin accepts the option to the way the
 * new bin does, `null` for the ones that have none. A legacy bin takes a long
 * name as `--name value` or `--name=value`, a short one as `-n value` only.
 */
// prettier-ignore
export const CLI_SCRIPTS_TABLE: CliScriptsTable = {
  "invocations": [
    {
      "bin": "transloco-keys-manager",
      "command": "extract",
      "to": "transloco",
      "positionals": "none",
      "options": [
        {
          "name": "project",
          "spellings": {
            "--project": "--project"
          },
          "outcome": "same",
          "takesValue": true
        },
        {
          "name": "config",
          "spellings": {
            "--config": "--config",
            "-c": "-c"
          },
          "outcome": "same",
          "takesValue": true,
          "mustExist": true
        },
        {
          "name": "input",
          "spellings": {
            "--input": "--input",
            "-i": "-i"
          },
          "outcome": "same",
          "takesValue": true,
          "list": true
        },
        {
          "name": "file-format",
          "spellings": {
            "--file-format": "--file-format",
            "-f": "-f"
          },
          "outcome": "same",
          "takesValue": true,
          "choices": [
            "json",
            "pot"
          ]
        },
        {
          "name": "marker",
          "spellings": {
            "--marker": "--marker",
            "-m": "-m"
          },
          "outcome": "same",
          "takesValue": true
        },
        {
          "name": "sort",
          "spellings": {
            "--sort": "--sort",
            "-s": "-s"
          },
          "outcome": "same"
        },
        {
          "name": "unflat",
          "spellings": {
            "--unflat": "--unflat",
            "-u": "-u"
          },
          "outcome": "same"
        },
        {
          "name": "default-value",
          "spellings": {
            "--default-value": "--default-value",
            "-d": "-d"
          },
          "outcome": "same",
          "takesValue": true,
          "allowEmpty": true
        },
        {
          "name": "output",
          "spellings": {
            "--output": "--output",
            "-o": "-o"
          },
          "outcome": "same",
          "takesValue": true
        },
        {
          "name": "langs",
          "spellings": {
            "--langs": "--langs",
            "-l": "-l"
          },
          "outcome": "same",
          "takesValue": true,
          "variadic": true
        },
        {
          "name": "replace",
          "spellings": {
            "--replace": "--replace",
            "-r": "-r"
          },
          "outcome": "same"
        },
        {
          "name": "remove-extra-keys",
          "spellings": {
            "--remove-extra-keys": "--remove-extra-keys",
            "-R": "-R"
          },
          "outcome": "same"
        },
        {
          "name": "translations-path",
          "spellings": {
            "--translations-path": null,
            "-p": null
          },
          "outcome": "dropped",
          "reason": "extract never reads it, and does not even warn about it",
          "takesValue": true
        },
        {
          "name": "add-missing-keys",
          "spellings": {
            "--add-missing-keys": null,
            "-a": null
          },
          "outcome": "dropped",
          "reason": "the extract command only warns about it and ignores it"
        },
        {
          "name": "emit-error-on-extra-keys",
          "spellings": {
            "--emit-error-on-extra-keys": null,
            "-e": null
          },
          "outcome": "dropped",
          "reason": "the extract command only warns about it and ignores it"
        },
        {
          "name": "help",
          "spellings": {
            "--help": null,
            "-h": null
          },
          "outcome": "leave",
          "reason": "transloco-keys-manager prints its own usage text for it, which is not the one of the transloco bin"
        }
      ]
    },
    {
      "bin": "transloco-keys-manager",
      "command": "find",
      "to": "transloco",
      "positionals": "none",
      "options": [
        {
          "name": "project",
          "spellings": {
            "--project": "--project"
          },
          "outcome": "same",
          "takesValue": true
        },
        {
          "name": "config",
          "spellings": {
            "--config": "--config",
            "-c": "-c"
          },
          "outcome": "same",
          "takesValue": true,
          "mustExist": true
        },
        {
          "name": "input",
          "spellings": {
            "--input": "--input",
            "-i": "-i"
          },
          "outcome": "same",
          "takesValue": true,
          "list": true
        },
        {
          "name": "file-format",
          "spellings": {
            "--file-format": "--file-format",
            "-f": "-f"
          },
          "outcome": "same",
          "takesValue": true,
          "choices": [
            "json",
            "pot"
          ]
        },
        {
          "name": "marker",
          "spellings": {
            "--marker": "--marker",
            "-m": "-m"
          },
          "outcome": "same",
          "takesValue": true
        },
        {
          "name": "sort",
          "spellings": {
            "--sort": "--sort",
            "-s": "-s"
          },
          "outcome": "same"
        },
        {
          "name": "unflat",
          "spellings": {
            "--unflat": "--unflat",
            "-u": "-u"
          },
          "outcome": "same"
        },
        {
          "name": "default-value",
          "spellings": {
            "--default-value": "--default-value",
            "-d": "-d"
          },
          "outcome": "same",
          "takesValue": true,
          "allowEmpty": true
        },
        {
          "name": "translations-path",
          "spellings": {
            "--translations-path": "--translations-path",
            "-p": "-p"
          },
          "outcome": "same",
          "takesValue": true
        },
        {
          "name": "add-missing-keys",
          "spellings": {
            "--add-missing-keys": "--add-missing-keys",
            "-a": "-a"
          },
          "outcome": "same"
        },
        {
          "name": "emit-error-on-extra-keys",
          "spellings": {
            "--emit-error-on-extra-keys": "--emit-error-on-extra-keys",
            "-e": "-e"
          },
          "outcome": "same"
        },
        {
          "name": "output",
          "spellings": {
            "--output": null,
            "-o": null
          },
          "outcome": "dropped",
          "reason": "the find command only warns about it and ignores it",
          "takesValue": true
        },
        {
          "name": "langs",
          "spellings": {
            "--langs": null,
            "-l": null
          },
          "outcome": "dropped",
          "reason": "find never reads it, and does not even warn about it",
          "takesValue": true,
          "variadic": true
        },
        {
          "name": "replace",
          "spellings": {
            "--replace": null,
            "-r": null
          },
          "outcome": "dropped",
          "reason": "the find command only warns about it and ignores it"
        },
        {
          "name": "remove-extra-keys",
          "spellings": {
            "--remove-extra-keys": null,
            "-R": null
          },
          "outcome": "dropped",
          "reason": "the find command only warns about it and ignores it"
        },
        {
          "name": "help",
          "spellings": {
            "--help": null,
            "-h": null
          },
          "outcome": "leave",
          "reason": "transloco-keys-manager prints its own usage text for it, which is not the one of the transloco bin"
        }
      ]
    },
    {
      "bin": "transloco-validator",
      "to": "transloco validate",
      "positionals": "files",
      "options": []
    },
    {
      "bin": "transloco-optimize",
      "to": "transloco optimize",
      "positionals": "dist",
      "options": [
        {
          "name": "dist",
          "spellings": {
            "--dist": "--dist",
            "-d": "-d"
          },
          "outcome": "same",
          "takesValue": true
        },
        {
          "name": "comments-key",
          "spellings": {
            "--commentsKey": "--comments-key",
            "-k": "-k"
          },
          "outcome": "respelled",
          "takesValue": true
        }
      ]
    },
    {
      "bin": "transloco-scoped-libs",
      "to": "transloco scoped-libs",
      "positionals": "none",
      "options": [
        {
          "name": "watch",
          "spellings": {
            "--watch": "--watch",
            "-w": "-w"
          },
          "outcome": "same"
        },
        {
          "name": "skip-gitignore",
          "spellings": {
            "--skip-gitignore": "--skip-gitignore",
            "-m": "--skip-gitignore"
          },
          "outcome": "respelled"
        }
      ]
    }
  ]
};
