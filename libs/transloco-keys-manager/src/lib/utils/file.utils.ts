import { readFileSync, writeFileSync } from 'fs';

import { stringify } from './object.utils';

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
    return JSON.parse(content);
  }

  return content;
}

export function writeFile(fileName: string, content: object) {
  writeFileSync(fileName, stringify(content), { encoding: 'utf-8' });
}
