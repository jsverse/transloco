import { writeFileSync } from 'node:fs';

import { readFile } from '../../utils/file.utils';

export async function runPrettier(filePaths: string[]) {
  try {
    const prettier = await import('prettier');
    const options = await prettier.resolveConfig(filePaths[0]);
    if (options) {
      for (const filePath of filePaths) {
        const formatted = await prettier.format(readFile(filePath), {
          ...options,
          filepath: filePath,
        });
        writeFileSync(filePath, formatted);
      }
    }
  } catch (e: any) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      console.warn('Failed to run prettier', e.message);
    }
  }
}
