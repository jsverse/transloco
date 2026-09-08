import { readFileSync, writeFileSync } from 'fs';

import { stringify } from './object.utils';
import { isString } from './validators.utils';

export function readFile(file: string): string;
export function readFile(file: string, config: { parse: false }): string;
export function readFile(
  file: string,
  config: { parse: true },
): Record<string, any>;
export function readFile(
  file: string,
  { parse }: { parse: boolean } = { parse: false },
): string | object {
  const content = readFileSync(file, { encoding: 'utf-8' });

  if (parse) {
    // Strip a leading BOM - some editors add one and it breaks JSON.parse.
    return JSON.parse(content.replace(/^\uFEFF/, ''));
  }

  return content;
}

export function writeFile(fileName: string, content: object | string) {
  const output = isString(content) ? content : stringify(content);

  writeFileSync(fileName, output, { encoding: 'utf-8' });
}
