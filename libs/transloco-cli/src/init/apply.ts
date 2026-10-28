import fs from 'node:fs';
import path from 'node:path';

import { CliError } from '../errors.js';
import { outputFile } from '../utils/file-system.js';
import { lstat } from '../utils/real-path.js';

import type { InitStep } from './plan.js';

/**
 * Does what each step is about, all or nothing: when a file can't be written,
 * what the steps before it did is undone, and nothing is told about before
 * that is certain.
 */
export function applySteps(
  steps: InitStep[],
  report: (step: InitStep) => void,
) {
  const journal = new Journal();

  for (const step of steps) {
    if (!step.write) continue;

    try {
      journal.remember(path.resolve(step.write.file));
      outputFile(path.resolve(step.write.file), step.write.content);
    } catch (error) {
      // The check before can't see what happens in between
      const left = journal.undo();

      throw new CliError(
        `Transloco Init: could not write ${step.write.file}: ${(error as Error).message}. ${
          left.length
            ? `Undoing it failed, these were left behind: ${left.join(', ')}.`
            : 'Nothing was changed.'
        }`,
      );
    }
  }

  steps.forEach(report);
}

/** What the run changed, and what it takes to put it back. */
class Journal {
  /** The content a file had before it was written over. */
  private overwritten: { file: string; content: Buffer }[] = [];
  /** The files the run creates. */
  private files: string[] = [];
  /** The folders the run creates, the outer one before the one inside it. */
  private folders: string[] = [];

  /** To be called before the file is written. */
  remember(file: string) {
    if (lstat(file)) {
      // A link is followed, the write goes through it as well
      this.overwritten.push({ file, content: fs.readFileSync(file) });

      return;
    }

    this.files.push(file);

    const missing: string[] = [];

    for (let dir = path.dirname(file); !lstat(dir); dir = path.dirname(dir)) {
      missing.unshift(dir);
    }

    this.folders.push(...missing);
  }

  /**
   * Puts back what was overwritten, removes the files that were created and
   * then the folders, if they are empty.
   * @returns what could not be put back, as it is to be told
   */
  undo() {
    const left: string[] = [];
    const attempt = (action: () => void, file: string, what: string) => {
      try {
        action();
      } catch {
        left.push(`${path.relative('', file)} (${what})`);
      }
    };

    for (const { file, content } of [...this.overwritten].reverse()) {
      attempt(
        () => fs.writeFileSync(file, content),
        file,
        'could not be restored',
      );
    }

    for (const file of [...this.files].reverse()) {
      // A file that was never made, as the write failed before it was
      if (!lstat(file)) continue;

      attempt(() => fs.rmSync(file, { force: true }), file, 'not removed');
    }

    for (const dir of [...this.folders].reverse()) {
      // A folder that was never made, as the write failed on the way to it
      if (!lstat(dir)) continue;

      attempt(() => fs.rmdirSync(dir), dir, 'folder not removed');
    }

    return left;
  }
}
