import type { DiffDeleted, DiffNew } from 'deep-diff';
import chalk from 'chalk';
import Table from 'cli-table3';

import { messages } from '../messages';
import { getLogger } from '../utils/logger';

import { mapDiffToKeys } from './map-diff-to-keys';

type Params = {
  addMissingKeys: boolean;
  emitErrorOnExtraKeys: boolean;
  langs: string[];
  diffsPerLang: {
    [lang: string]: {
      missing: DiffNew<any>[];
      extra: DiffDeleted<any>[];
    };
  };
};

export interface BuildTableResult {
  hasMissingKeys: boolean;
  hasExtraKeys: boolean;
}

export function buildTable({
  langs,
  diffsPerLang,
  addMissingKeys,
  emitErrorOnExtraKeys,
}: Params): BuildTableResult {
  const logger = getLogger();
  let displayAddedMsg = false;
  let hasExtraKeys = false;
  let hasMissingKeys = false;

  if (langs.length > 0) {
    logger.success(`\x1b[4m${messages.summary}\x1b[0m\n`);
    const table = new Table({
      style: {
        border: ['white'],
      },
      head: ['File Name', 'Missing Keys', 'Extra Keys'].map((h) =>
        chalk.cyan(h),
      ),
    });

    for (let i = 0; i < langs.length; i++) {
      const row: any = [];
      const { missing, extra } = diffsPerLang[langs[i]];
      const hasMissing = missing.length > 0;
      const hasExtra = extra.length > 0;

      if (!(hasExtra || hasMissing)) continue;

      row.push(chalk.blueBright(langs[i]));

      if (hasMissing) {
        row.push(mapDiffToKeys(missing, 'rhs'));
        displayAddedMsg = true;
        hasMissingKeys = true;
      } else {
        row.push('--');
      }

      if (hasExtra) {
        row.push(mapDiffToKeys(extra, 'lhs'));
        hasExtraKeys = true;
      } else {
        row.push('--');
      }
      table.push(row);
    }

    logger.log(table.toString());
    if (displayAddedMsg) {
      if (addMissingKeys) {
        logger.success(`Added all missing keys\n`);
        hasMissingKeys = false;
      }
    }
  } else {
    logger.log(`\n🎉 ${messages.noMissing} 🎉\n`);
  }

  logger.log('\n');

  return {
    hasMissingKeys: hasMissingKeys && !addMissingKeys,
    hasExtraKeys: hasExtraKeys && emitErrorOnExtraKeys,
  };
}
