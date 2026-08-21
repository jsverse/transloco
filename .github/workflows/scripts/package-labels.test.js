/**
 * Run with: node --test .github/workflows/scripts/
 *
 * Fixtures are trimmed from real issue bodies in jsverse/transloco, so the shapes here
 * are the ones the parser actually meets — including the pre-form issues that have no
 * dropdown at all, and the reporter who typed a package name instead of picking one.
 */
const test = require('node:test');
const assert = require('node:assert');
const { packageLabelsFor, normalize } = require('./package-labels.js');

const question = '### Which Transloco package(s) are the source of the bug?';
const withAnswer = (answer) =>
  `### Is there an existing issue for this?\n\n- [x] I have searched\n\n${question}\n\n${answer}\n\n### Is this a regression?\n\nNo\n`;

test('given a single selected package, when parsed, then it maps to that label', () => {
  const result = packageLabelsFor(withAnswer('Transloco'));
  assert.deepStrictEqual(result.labels, ['transloco']);
  assert.strictEqual(result.answered, true);
});

test('given multiple selected packages, when parsed, then every one maps', () => {
  // #900 selected both of these.
  assert.deepStrictEqual(
    packageLabelsFor(withAnswer('Transloco, MessageFormat')).labels,
    ['transloco', 'messageformat'],
  );
});

test('given multi-word package names, when parsed, then they map to hyphenated labels', () => {
  assert.deepStrictEqual(
    packageLabelsFor(withAnswer('Persist Lang, Scoped Libs, Keys Manager'))
      .labels,
    ['persist-lang', 'scoped-libs', 'keys-manager'],
  );
});

test('given surrounding whitespace, when parsed, then options still match', () => {
  // Several issues render as " Transloco, Locale " with padding.
  assert.deepStrictEqual(
    packageLabelsFor(withAnswer(' Transloco, Locale ')).labels,
    ['transloco', 'locale'],
  );
});

test('given a raw package name typed instead of a selection, when parsed, then it still maps', () => {
  // #621 typed the npm name rather than picking an option.
  assert.deepStrictEqual(
    packageLabelsFor(withAnswer('@ngneat/transloco-messageformat')).labels,
    ['messageformat'],
  );
});

test('given "Don\'t know / other", when parsed, then it yields no label but counts as answered', () => {
  const result = packageLabelsFor(withAnswer("Don't know / other"));
  assert.deepStrictEqual(result.labels, []);
  assert.deepStrictEqual(
    result.unknown,
    [],
    'a known option must not be reported as unknown',
  );
  assert.strictEqual(result.answered, true);
});

test('given a mix of a real package and "Don\'t know / other", when parsed, then the real one maps', () => {
  // #716 selected Transloco, Scoped Libs and Don't know / other together.
  assert.deepStrictEqual(
    packageLabelsFor(withAnswer("Transloco, Scoped Libs, Don't know / other"))
      .labels,
    ['transloco', 'scoped-libs'],
  );
});

test('given an unanswered dropdown, when parsed, then nothing is reported as answered', () => {
  const body = `${question}\n\n_No response_\n\n### Current behavior\n\nbroken\n`;
  assert.deepStrictEqual(packageLabelsFor(body), {
    labels: [],
    answered: false,
    unknown: [],
  });
});

test('given the next heading immediately after, when parsed, then the answer is treated as empty', () => {
  const body = `${question}\n\n### Current behavior\n\nbroken\n`;
  assert.strictEqual(packageLabelsFor(body).answered, false);
});

test('given a pre-form issue with no dropdown, when parsed, then it is not answered', () => {
  // Everything filed before the YAML forms existed, plus the keys-manager transfers.
  assert.strictEqual(
    packageLabelsFor('I have an app with a lazy loaded module.').answered,
    false,
  );
});

test('given an empty or missing body, when parsed, then it does not throw', () => {
  assert.strictEqual(packageLabelsFor('').answered, false);
  assert.strictEqual(packageLabelsFor(null).answered, false);
  assert.strictEqual(packageLabelsFor(undefined).answered, false);
});

test('given an unrecognised option, when parsed, then it is surfaced rather than silently dropped', () => {
  const result = packageLabelsFor(withAnswer('Transloco, Some New Package'));
  assert.deepStrictEqual(result.labels, ['transloco']);
  assert.deepStrictEqual(result.unknown, ['Some New Package']);
});

test('given CRLF line endings, when parsed, then the answer is still found', () => {
  assert.deepStrictEqual(
    packageLabelsFor(withAnswer('Locale').replace(/\n/g, '\r\n')).labels,
    ['locale'],
  );
});

test('given assorted option spellings, when normalised, then they collapse to one key', () => {
  assert.strictEqual(normalize('Persist Lang'), 'persist lang');
  assert.strictEqual(normalize('persist-lang'), 'persist lang');
  assert.strictEqual(normalize('@jsverse/transloco-locale'), 'locale');
});
