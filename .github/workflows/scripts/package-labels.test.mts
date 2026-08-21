/**
 * Run with: node --test .github/workflows/scripts/package-labels.test.mts
 *
 * Fixtures are trimmed from real issue bodies in jsverse/transloco, so the shapes here
 * are the ones the parser actually meets — including the pre-form issues that have no
 * dropdown at all, and the reporter who typed a package name instead of picking one.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';

import { packageLabelsFor, normalize } from './package-labels.mts';

const question = '### Which Transloco package(s) are the source of the bug?';

const bodyAnswering = (answer: string) =>
  `### Is there an existing issue for this?\n\n- [x] I have searched\n\n${question}\n\n${answer}\n\n### Is this a regression?\n\nNo\n`;

describe('packageLabelsFor', () => {
  describe('answers that name a package', () => {
    it(`GIVEN the dropdown names a single package
        WHEN the labels are derived
        THEN returns that package's label and marks the answer as present`, () => {
      const result = packageLabelsFor(bodyAnswering('Transloco'));

      assert.deepStrictEqual(result.labels, ['transloco']);
      assert.strictEqual(result.answered, true);
    });

    it(`GIVEN the dropdown names two packages
        WHEN the labels are derived
        THEN returns a label for each of them`, () => {
      // #900 selected both of these.
      const result = packageLabelsFor(
        bodyAnswering('Transloco, MessageFormat'),
      );

      assert.deepStrictEqual(result.labels, ['transloco', 'messageformat']);
    });

    it(`GIVEN the dropdown names multi-word packages
        WHEN the labels are derived
        THEN returns their hyphenated labels`, () => {
      const result = packageLabelsFor(
        bodyAnswering('Persist Lang, Scoped Libs, Keys Manager'),
      );

      assert.deepStrictEqual(result.labels, [
        'persist-lang',
        'scoped-libs',
        'keys-manager',
      ]);
    });

    it(`GIVEN the answer is padded with surrounding whitespace
        WHEN the labels are derived
        THEN still matches the options`, () => {
      // Several issues render as " Transloco, Locale " with padding.
      const result = packageLabelsFor(bodyAnswering(' Transloco, Locale '));

      assert.deepStrictEqual(result.labels, ['transloco', 'locale']);
    });

    it(`GIVEN a reporter typed an npm package name instead of selecting an option
        WHEN the labels are derived
        THEN resolves it to the matching package label`, () => {
      // #621 typed the npm name rather than picking an option.
      const result = packageLabelsFor(
        bodyAnswering('@ngneat/transloco-messageformat'),
      );

      assert.deepStrictEqual(result.labels, ['messageformat']);
    });

    it(`GIVEN the body uses CRLF line endings
        WHEN the labels are derived
        THEN still finds the answer`, () => {
      const result = packageLabelsFor(
        bodyAnswering('Locale').replace(/\n/g, '\r\n'),
      );

      assert.deepStrictEqual(result.labels, ['locale']);
    });
  });

  describe("answers that don't resolve to a package", () => {
    it(`GIVEN the reporter picked "Don't know / other"
        WHEN the labels are derived
        THEN returns no label but still marks the answer as present`, () => {
      const result = packageLabelsFor(bodyAnswering("Don't know / other"));

      assert.deepStrictEqual(result.labels, []);
      assert.deepStrictEqual(
        result.unknown,
        [],
        'a known option must not be reported as unknown',
      );
      assert.strictEqual(result.answered, true);
    });

    it(`GIVEN "Don't know / other" is picked alongside real packages
        WHEN the labels are derived
        THEN returns labels for the real packages only`, () => {
      // #716 selected Transloco, Scoped Libs and Don't know / other together.
      const result = packageLabelsFor(
        bodyAnswering("Transloco, Scoped Libs, Don't know / other"),
      );

      assert.deepStrictEqual(result.labels, ['transloco', 'scoped-libs']);
    });

    it(`GIVEN an option the label map does not know
        WHEN the labels are derived
        THEN surfaces it as unknown rather than dropping it silently`, () => {
      const result = packageLabelsFor(
        bodyAnswering('Transloco, Some New Package'),
      );

      assert.deepStrictEqual(result.labels, ['transloco']);
      assert.deepStrictEqual(result.unknown, ['Some New Package']);
    });
  });

  describe('bodies with no answer to read', () => {
    it(`GIVEN the dropdown was left as "_No response_"
        WHEN the labels are derived
        THEN reports that nothing was answered`, () => {
      const body = `${question}\n\n_No response_\n\n### Current behavior\n\nbroken\n`;

      assert.deepStrictEqual(packageLabelsFor(body), {
        labels: [],
        answered: false,
        unknown: [],
      });
    });

    it(`GIVEN the next question follows immediately after the dropdown
        WHEN the labels are derived
        THEN treats the answer as empty rather than reading the next heading`, () => {
      const body = `${question}\n\n### Current behavior\n\nbroken\n`;

      assert.strictEqual(packageLabelsFor(body).answered, false);
    });

    it(`GIVEN a pre-form issue whose body has no dropdown at all
        WHEN the labels are derived
        THEN reports that nothing was answered`, () => {
      // Everything filed before the YAML forms existed, plus the keys-manager transfers.
      const result = packageLabelsFor(
        'I have an app with a lazy loaded module.',
      );

      assert.strictEqual(result.answered, false);
    });

    it(`GIVEN the body is empty, null or undefined
        WHEN the labels are derived
        THEN reports that nothing was answered without throwing`, () => {
      assert.strictEqual(packageLabelsFor('').answered, false);
      assert.strictEqual(packageLabelsFor(null).answered, false);
      assert.strictEqual(packageLabelsFor(undefined).answered, false);
    });
  });
});

describe('normalize', () => {
  it(`GIVEN spellings that differ by case, separator or npm scope
      WHEN they are normalised
      THEN they collapse to the same lookup key`, () => {
    assert.strictEqual(normalize('Persist Lang'), 'persist lang');
    assert.strictEqual(normalize('persist-lang'), 'persist lang');
    assert.strictEqual(normalize('@jsverse/transloco-locale'), 'locale');
  });
});
