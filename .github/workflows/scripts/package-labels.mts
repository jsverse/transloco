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

/**
 * The `changes` object on an `issues.edited` payload. Both keys are optional — GitHub
 * sends only the ones the edit actually touched — and only `body` matters here.
 */
export interface IssueChanges {
  body?: { from?: string | null };
  title?: { from?: string | null };
}

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
    // `Object.hasOwn` rather than a truthiness check: an object literal inherits
    // `constructor` and friends, which would otherwise read as a matching label.
    const label = Object.hasOwn(PACKAGE_LABELS, key)
      ? PACKAGE_LABELS[key]
      : undefined;
    if (label) labels.push(label);
    else if (!NO_LABEL.has(key)) unknown.push(option.trim());
  }
  return { labels: [...new Set(labels)], answered: true, unknown };
}

/**
 * The labels an edit newly asks for, given the body it replaced.
 *
 * `issues.edited` re-runs the workflow over the whole body, so a package label a
 * maintainer deliberately removed would otherwise come back on the reporter's next
 * unrelated edit. Anything the previous body already implied has had its chance to be
 * applied; only options the edit itself introduced count as new signal.
 */
export function labelsAddedByEdit(
  changes: IssueChanges | null | undefined,
  body: string | null | undefined,
): string[] {
  // Keyed on the presence of `body`, not on its content: GitHub omits the key entirely
  // when the edit left the body alone, while `from: ''` is a real edit to an empty body.
  if (!changes?.body) return [];
  const before = new Set(packageLabelsFor(changes.body.from).labels);
  return packageLabelsFor(body).labels.filter((label) => !before.has(label));
}

export { PACKAGE_LABELS, NO_LABEL };
