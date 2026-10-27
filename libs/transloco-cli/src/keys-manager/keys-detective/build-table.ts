import Table from 'cli-table3';

import { style } from '../../utils/style.js';
import { messages } from '../messages.js';
import { getLogger } from '../utils/logger.js';

import { mapDiffToKeys } from './map-diff-to-keys.js';

type Params = {
  addMissingKeys: boolean;
  emitErrorOnExtraKeys: boolean;
  langs: string[];
  diffsPerLang: {
    [lang: string]: {
      missing: any[];
      extra: any[];
    };
  };
};

export function buildTable({
  langs,
  diffsPerLang,
  addMissingKeys,
  emitErrorOnExtraKeys,
}: Params) {
  const logger = getLogger();
  if (langs.length > 0) {
    let displayAddedMsg = false;
    let hasExtraKeys = false;

    logger.success(`${style('underline', messages.summary)}\n`);
    const table = new Table({
      style: { border: [], head: [] },
      head: ['File Name', 'Missing Keys', 'Extra Keys'].map((h) =>
        style('cyan', h),
      ),
    });

    for (let i = 0; i < langs.length; i++) {
      const row: any = [];
      const { missing, extra } = diffsPerLang[langs[i]];
      const hasMissing = missing.length > 0;
      const hasExtra = extra.length > 0;

      if (!(hasExtra || hasMissing)) continue;

      row.push(style('blueBright', langs[i]));

      if (hasMissing) {
        row.push(mapDiffToKeys(missing, 'rhs'));
        displayAddedMsg = true;
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
      } else {
        // Not `process.exit`, which may end the process before a piped stdout
        // took the whole table
        process.exitCode = 1;

        return;
      }
    }

    if (hasExtraKeys && emitErrorOnExtraKeys) {
      process.exitCode = 2;

      return;
    }
  } else {
    logger.log(`\n🎉 ${messages.noMissing} 🎉\n`);
  }

  logger.log('\n');
}
