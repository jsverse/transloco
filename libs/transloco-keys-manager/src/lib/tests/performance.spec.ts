import { performance } from 'node:perf_hooks';
import path from 'node:path';
import os from 'node:os';

import fs from 'fs-extra';
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest';
import { tsquery } from '@phenomnomnominal/tsquery';
import { parseTemplate as ngParseTemplate } from '@angular/compiler';

import { templateExtractor } from '../keys-builder/template';
import { pipeExtractor } from '../keys-builder/template/pipe.extractor';
import { directiveExtractor } from '../keys-builder/template/directive.extractor';
import { structuralDirectiveExtractor } from '../keys-builder/template/structural-directive.extractor';
import { extractTSKeys } from '../keys-builder/typescript';
import { readFile } from '../utils/file.utils';
import { setConfig } from '../config';
import { ScopeMap, Scopes } from '../types';

/**
 * Performance benchmarks to ensure the tool scales to large monorepo apps and
 * that key optimizations (early-exit, parse-once) actually take effect.
 *
 * These assert on *behavior* (e.g. how many times an expensive parse
 * function is invoked, or that expected keys are extracted) rather than on
 * wall-clock timings, which are prone to flake under CI/scheduler noise.
 * Timings are still logged with console.info for informational purposes.
 */

vi.mock('../utils/logger', () => ({
  getLogger: () => ({
    log: vi.fn(),
    success: vi.fn(),
    startSpinner: vi.fn(),
  }),
  devlog: vi.fn(),
}));

vi.mock('@angular/compiler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@angular/compiler')>();
  return {
    ...actual,
    parseTemplate: vi.fn(actual.parseTemplate),
  };
});

const PERF_TMP = path.join(
  os.tmpdir(),
  `transloco-perf-test-${process.pid}-${Date.now()}`,
);

function generateTemplate(
  componentIndex: number,
  keysPerComponent: number,
): string {
  const lines: string[] = ['<div>'];
  for (let i = 1; i <= keysPerComponent; i++) {
    const key = `comp${componentIndex}.key${i}`;
    if (i % 4 === 0) {
      lines.push(
        `  <ng-container *transloco="let t; scope: 'comp${componentIndex}'">`,
      );
      lines.push(`    <span>{{ t('key${i}') }}</span>`);
      lines.push(`  </ng-container>`);
    } else if (i % 4 === 1) {
      lines.push(`  <p>{{ '${key}' | transloco }}</p>`);
    } else if (i % 4 === 2) {
      lines.push(`  <span transloco="${key}"></span>`);
    } else {
      lines.push(
        `  <span [transloco]="'${key}'">{{'${key}.alt' | transloco}}</span>`,
      );
    }
  }
  lines.push('</div>');
  return lines.join('\n');
}

function generateTsContent(
  componentIndex: number,
  withTransloco: boolean,
): string {
  if (withTransloco) {
    return `import { Component } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-comp-${componentIndex}',
  template: \`<p>{{ 'comp${componentIndex}.inline1' | transloco }}</p>\`,
})
export class Comp${componentIndex}Component {
  constructor(private transloco: TranslocoService) {
    this.transloco.translate('comp${componentIndex}.service.key1');
    this.transloco.translate('comp${componentIndex}.service.key2');
  }
}
`;
  }
  return `import { Component } from '@angular/core';
@Component({ selector: 'app-other-${componentIndex}', template: '<div>Hello</div>' })
export class Other${componentIndex}Component {
  onClick() { console.log('clicked'); }
}
`;
}

function generateLargeJson(keyCount: number): Record<string, string> {
  const translation: Record<string, string> = {};
  for (let i = 0; i < keyCount; i++) {
    translation[
      `section${Math.floor(i / 100)}.subsection${Math.floor(i / 10)}.key${i}`
    ] = `Translation value for key number ${i}`;
  }
  return translation;
}

describe('Performance Benchmarks', () => {
  const COMPONENT_COUNT = 200;
  const KEYS_PER_COMPONENT = 20;
  const LARGE_JSON_KEYS = 10000;

  beforeAll(() => {
    fs.ensureDirSync(PERF_TMP);
    // Set global config needed by comments extractor
    setConfig({
      marker: 't',
      input: [PERF_TMP],
      output: PERF_TMP,
      translationsPath: PERF_TMP,
      langs: ['en'],
      defaultValue: '',
      fileFormat: 'json',
      sort: false,
      unflat: false,
      replace: false,
      removeExtraKeys: false,
      addMissingKeys: false,
      emitErrorOnExtraKeys: false,
      scopes: { aliasToScope: {}, scopeToAlias: {} },
      scopePathMap: {},
    } as any);
    // Pre-generate template files on disk (needed by comments extractor)
    for (let i = 0; i < COMPONENT_COUNT; i++) {
      fs.writeFileSync(
        path.join(PERF_TMP, `comp${i}.html`),
        generateTemplate(i, KEYS_PER_COMPONENT),
      );
    }
    fs.writeFileSync(
      path.join(PERF_TMP, 'transloco-benchmark.html'),
      `<div><p>{{ 'feature.title' | transloco }}</p></div>`.repeat(50),
    );
    fs.writeFileSync(
      path.join(PERF_TMP, 'parse-once.html'),
      generateTemplate(999, 50),
    );
    for (let i = 0; i < 500; i++) {
      fs.writeFileSync(
        path.join(PERF_TMP, `non-transloco-${i}.ts`),
        generateTsContent(i, false),
      );
      fs.writeFileSync(
        path.join(PERF_TMP, `with-transloco-${i}.ts`),
        generateTsContent(i, true),
      );
    }
  });

  afterAll(() => {
    fs.removeSync(PERF_TMP);
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.mocked(ngParseTemplate).mockClear();
  });

  it(`should extract keys from ${COMPONENT_COUNT} templates (${KEYS_PER_COMPONENT} keys each)`, () => {
    const scopes: Scopes = { aliasToScope: {}, scopeToAlias: {} };

    const start = performance.now();
    let totalKeys = 0;
    for (let i = 0; i < COMPONENT_COUNT; i++) {
      const content = generateTemplate(i, KEYS_PER_COMPONENT);
      const scopeToKeys: ScopeMap = { __global: {} };
      templateExtractor({
        file: path.join(PERF_TMP, `comp${i}.html`),
        content,
        scopes,
        defaultValue: '',
        scopeToKeys,
      });
      totalKeys += Object.keys(scopeToKeys.__global).length;
    }
    const elapsed = performance.now() - start;

    console.info(
      `\n⏱  Template extraction (${COMPONENT_COUNT} templates × ${KEYS_PER_COMPONENT} keys): ${elapsed.toFixed(0)}ms`,
    );
    // Behavioral assertion: every template's keys were actually extracted,
    // regardless of how long it took. Each component's generated template
    // yields more than KEYS_PER_COMPONENT distinct keys (some markup
    // branches emit an extra `.alt` key), so assert against the keys
    // produced by a single template scaled to the full component count.
    const sampleScopeToKeys: ScopeMap = { __global: {} };
    templateExtractor({
      file: path.join(PERF_TMP, 'comp0.html'),
      content: generateTemplate(0, KEYS_PER_COMPONENT),
      scopes,
      defaultValue: '',
      scopeToKeys: sampleScopeToKeys,
    });
    const keysPerTemplate = Object.keys(sampleScopeToKeys.__global).length;
    expect(keysPerTemplate).toBeGreaterThan(0);
    expect(totalKeys).toBe(COMPONENT_COUNT * keysPerTemplate);
  });

  // The exact iteration count isn't load-bearing — only that the early-exit
  // path is called zero times and the real-parse path is called exactly
  // `iterations` times. Kept small so real (unmocked) Angular template
  // parsing stays fast and doesn't flake under CI's coverage instrumentation.
  it('should skip non-transloco templates without parsing them', () => {
    const scopes: Scopes = { aliasToScope: {}, scopeToAlias: {} };
    const content =
      '<div><p>Hello World</p><span class="title">No i18n here</span></div>'.repeat(
        50,
      );
    const translocoContent =
      `<div><p>{{ 'feature.title' | transloco }}</p></div>`.repeat(50);
    const iterations = 30;

    const skipScopeToKeys: ScopeMap = { __global: {} };
    for (let i = 0; i < iterations; i++) {
      templateExtractor({
        file: path.join(PERF_TMP, `skip${i}.html`),
        content,
        scopes,
        defaultValue: '',
        scopeToKeys: skipScopeToKeys,
      });
    }
    // The early-exit path never reaches the (expensive) Angular template
    // parser for content that doesn't mention transloco.
    expect(ngParseTemplate).not.toHaveBeenCalled();
    expect(Object.keys(skipScopeToKeys.__global)).toHaveLength(0);

    for (let i = 0; i < iterations; i++) {
      const scopeToKeys: ScopeMap = { __global: {} };
      templateExtractor({
        file: path.join(PERF_TMP, 'transloco-benchmark.html'),
        content: translocoContent,
        scopes,
        defaultValue: '',
        scopeToKeys,
      });
    }
    // Content that does mention transloco must go through the real parser,
    // once per call.
    expect(ngParseTemplate).toHaveBeenCalledTimes(iterations);
  });

  it(`should parse and read a ${LARGE_JSON_KEYS}-key JSON file`, () => {
    const jsonPath = path.join(PERF_TMP, 'large.json');
    const data = generateLargeJson(LARGE_JSON_KEYS);
    fs.writeJsonSync(jsonPath, data);

    const start = performance.now();
    const result = readFile(jsonPath, { parse: true });
    const elapsed = performance.now() - start;

    console.info(
      `\n⏱  JSON read+parse (${LARGE_JSON_KEYS} keys): ${elapsed.toFixed(2)}ms`,
    );
    expect(Object.keys(result)).toHaveLength(LARGE_JSON_KEYS);
  });

  it('should handle malformed JSON by throwing (callers handle error)', () => {
    const malformedPath = path.join(PERF_TMP, 'malformed.json');
    fs.writeFileSync(malformedPath, '{ invalid json content here !!!');

    expect(() => readFile(malformedPath, { parse: true })).toThrow(SyntaxError);
  });

  it('should early-exit TS AST parsing for non-transloco files', () => {
    const astSpy = vi.spyOn(tsquery, 'ast');
    const nonTranslocoCount = 500;

    const resultWithExit = extractTSKeys({
      input: [PERF_TMP],
      files: Array.from({ length: nonTranslocoCount }, (_, i) =>
        path.join(PERF_TMP, `non-transloco-${i}.ts`),
      ),
      scopes: { aliasToScope: {}, scopeToAlias: {} },
      defaultValue: '',
    } as any);

    expect(resultWithExit.fileCount).toBe(nonTranslocoCount);
    // Non-transloco files must never reach the (expensive) TS AST parser.
    expect(astSpy).not.toHaveBeenCalled();

    astSpy.mockClear();

    const resultNoExit = extractTSKeys({
      input: [PERF_TMP],
      files: Array.from({ length: nonTranslocoCount }, (_, i) =>
        path.join(PERF_TMP, `with-transloco-${i}.ts`),
      ),
      scopes: { aliasToScope: {}, scopeToAlias: {} },
      defaultValue: '',
    } as any);

    expect(resultNoExit.fileCount).toBe(nonTranslocoCount);
    // Files that reference transloco must be parsed, once per file.
    expect(astSpy).toHaveBeenCalledTimes(nonTranslocoCount);

    astSpy.mockRestore();
  });

  // Same rationale as the skip-test above: ~400 real template parses, which
  // is comfortably fast uninstrumented but can approach the default timeout
  // under CI's v8 coverage instrumentation plus runner variance.
  // As above: a small iteration count is sufficient to prove "1 parse per
  // call" vs. "N parses per call" — it doesn't need to be large to be valid.
  it('should parse each template exactly once and share the result across extractors', () => {
    const largeTemplate = generateTemplate(999, 50);
    const iterations = 10;
    const scopes: Scopes = { aliasToScope: {}, scopeToAlias: {} };

    // Old behavior: each extractor parses the template independently.
    for (let i = 0; i < iterations; i++) {
      const config = {
        file: path.join(PERF_TMP, 'parse-once.html'),
        content: largeTemplate,
        scopes,
        defaultValue: '',
        scopeToKeys: { __global: {} },
      };
      pipeExtractor(config);
      directiveExtractor(config);
      structuralDirectiveExtractor(config);
    }
    expect(ngParseTemplate).toHaveBeenCalledTimes(iterations * 3);

    vi.mocked(ngParseTemplate).mockClear();

    // New behavior: templateExtractor parses once and shares the result.
    for (let i = 0; i < iterations; i++) {
      templateExtractor({
        file: path.join(PERF_TMP, 'parse-once.html'),
        content: largeTemplate,
        scopes,
        defaultValue: '',
        scopeToKeys: { __global: {} },
      });
    }
    // Exactly one parse per template, regardless of how many extractors run.
    expect(ngParseTemplate).toHaveBeenCalledTimes(iterations);
  });
});
