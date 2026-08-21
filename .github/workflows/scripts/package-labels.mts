/**
 * Maps the "Which Transloco package(s)…" answer in an issue body to package labels.
 *
 * The issue forms render a dropdown answer as a `### <question>` heading followed by
 * the selected options on the next non-empty line, comma separated. Reporters who pick
 * nothing get `_No response_`, which we treat as "no signal" rather than an error.
 *
 * Pure functions with no I/O so the parsing can be unit-tested on its own.
 */

/** Dropdown option (normalised) -> the label it maps to. */
const PACKAGE_LABELS: Record<string, string> = {
  transloco: 'transloco',
  schematics: 'schematics',
  locale: 'locale',
  messageformat: 'messageformat',
  optimize: 'optimize',
  'persist lang': 'persist-lang',
  'persist translations': 'persist-translations',
  'preload langs': 'preload-langs',
  'scoped libs': 'scoped-libs',
  'keys manager': 'keys-manager',
  validator: 'validator',
};

/** Recognised answers that intentionally map to no label. */
const NO_LABEL = new Set(["don't know / other", 'dont know / other', 'other']);

const QUESTION = /which transloco package/i;
const NO_RESPONSE = /^_?no response_?$/i;

export interface PackageLabelResult {
  labels: string[];
  /** Distinguishes "picked Don't know / other" from "the form has no such field". */
  answered: boolean;
  /** Options the dropdown offers that this map doesn't know about. */
  unknown: string[];
}

/** Normalise an option so "Persist Lang", "persist-lang" and "Persist  Lang" all match. */
export function normalize(option: string): string {
  return option
    .trim()
    .toLowerCase()
    .replace(/^@jsverse\//, '')
    .replace(/^@ngneat\//, '')
    .replace(/^transloco-/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pull the raw answer text for the affected-packages dropdown, or null if absent. */
export function readAnswer(body: string | null | undefined): string | null {
  if (!body) return null;
  const lines = body.replace(/\r/g, '').split('\n');
  const start = lines.findIndex(
    (line) => line.startsWith('###') && QUESTION.test(line),
  );
  if (start === -1) return null;

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('###')) return null; // next question — this one was left empty
    return NO_RESPONSE.test(line) ? null : line;
  }
  return null;
}

export function packageLabelsFor(
  body: string | null | undefined,
): PackageLabelResult {
  const answer = readAnswer(body);
  if (answer === null) return { labels: [], answered: false, unknown: [] };

  const labels: string[] = [];
  const unknown: string[] = [];
  for (const option of answer.split(',')) {
    const key = normalize(option);
    if (!key) continue;
    if (PACKAGE_LABELS[key]) labels.push(PACKAGE_LABELS[key]);
    else if (!NO_LABEL.has(key)) unknown.push(option.trim());
  }
  return { labels: [...new Set(labels)], answered: true, unknown };
}

export { PACKAGE_LABELS, NO_LABEL };
