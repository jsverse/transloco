import nodePath from 'node:path';

import fs from 'fs-extra';
import { expect, vi } from 'vitest';

import { Config } from '../types';
import { getCurrentTranslation } from '../keys-builder/utils/get-current-translation';

import { sourceRoot } from './buildTranslationFiles/build-translation-utils';

export function noop() {}

export function spyOnConsole(method: 'log' | 'warn') {
  return vi.spyOn(console, method).mockImplementation(noop);
}

export function spyOnProcess(method: 'exit') {
  return vi.spyOn(process, method).mockImplementation(noop as any);
}

export function mockResolveProjectBasePath(projectBasePath: string) {
  vi.doMock('../utils/resolve-project-base-path', () => ({
    resolveProjectBasePath: vi.fn().mockReturnValue({ projectBasePath }),
  }));
}

export const defaultValue = 'missing';
export const defaultValueWithParams = 'missing{{params}}';

export function resolveValueWithParams(params: string[]) {
  return defaultValueWithParams.replace(
    '{{params}}',
    params.map((p) => `{{${p}}}`).join(' '),
  );
}

export function buildKeysFromParams(params: string[]) {
  return params.reduce(
    (acc, p) => {
      acc[p] = resolveValueWithParams([p]);

      return acc;
    },
    {} as Record<string, string>,
  );
}

export interface BuildConfigOptions {
  config?: Partial<Config>;
  sourceRoot: string;
}

export function buildConfig({ config = {}, sourceRoot }: BuildConfigOptions) {
  const output = nodePath.join(sourceRoot, `i18n`);
  return {
    input: [nodePath.join(sourceRoot, 'src')],
    output,
    translationsPath: output,
    langs: ['en', 'es', 'it'],
    defaultValue,
    ...config,
  } as Config;
}

export function paramsTestConfig(config: Config) {
  return {
    ...config,
    input: [nodePath.resolve(config.input[0], '../', 'with-params')],
    defaultValue: defaultValueWithParams,
  };
}

export function removeI18nFolder(root = sourceRoot) {
  fs.removeSync(nodePath.join(root, 'i18n'));
}

export interface AssertTranslationParams extends Pick<Config, 'fileFormat'> {
  expected: object;
  path?: string;
  root: string;
}

export function assertTranslation({
  expected,
  ...rest
}: AssertTranslationParams) {
  expect(loadTranslationFile(rest)).toEqual(expected);
}

export function assertPartialTranslation({
  expected,
  ...rest
}: AssertTranslationParams) {
  expect(loadTranslationFile(rest)).toMatchObject(expected);
}

function loadTranslationFile({
  path,
  fileFormat,
  root,
}: Omit<AssertTranslationParams, 'expected'>) {
  return getCurrentTranslation({
    path: nodePath.join(root, 'i18n', `${path || ''}en.${fileFormat}`),
    fileFormat,
  });
}

interface GenerateKeysParams {
  start?: number;
  end: number;
  prefix?: string;
  withParams?: boolean;
}
export function generateKeys({
  start = 1,
  end,
  prefix,
  withParams = false,
}: GenerateKeysParams): { [index: string]: string } {
  let keys: Record<string, string> = {};
  for (let i = start; i <= end; i++) {
    const key = prefix ? `${prefix}.${i}` : `${i}`;
    if (withParams) {
      keys = {
        ...keys,
        ...buildKeysFromParams([key]),
      };
    } else {
      keys[key] = defaultValue;
    }
  }
  return keys;
}
