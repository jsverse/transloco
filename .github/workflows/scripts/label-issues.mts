/**
 * Applies package labels to an issue based on its affected-packages answer.
 *
 * Run by `.github/workflows/label-issues.yml` as `node .github/workflows/scripts/label-issues.mts`,
 * matching how `tools/scripts/*.mts` are invoked — Node strips the types, so there is
 * nothing to install and no loader to configure.
 *
 * Only ever ADDS labels, and on an `edited` event only the packages that edit newly
 * selected, so a label removed during triage stays removed.
 */
import { readFile } from 'node:fs/promises';
import { labelsAddedByEdit, packageLabelsFor } from './package-labels.mts';

interface Label {
  name: string;
}
interface IssuePayload {
  number: number;
  body?: string | null;
  labels?: Label[];
}

const API = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const eventPath = process.env.GITHUB_EVENT_PATH;

/** GitHub renders `::warning::` as an annotation on the workflow run. */
const warn = (message: string) => console.log(`::warning::${message}`);

function required(value: string | undefined, name: string): string {
  if (!value)
    throw new Error(
      `${name} is not set; this script must run inside GitHub Actions.`,
    );
  return value;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${required(token, 'GITHUB_TOKEN')}`,
      'x-github-api-version': '2022-11-28',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(
      `${init.method ?? 'GET'} ${path} failed: ${response.status} ${await response.text()}`,
    );
  }
  return response.json() as Promise<T>;
}

/** Every label defined in the repo — `addLabels` would otherwise create missing ones on the fly. */
async function repoLabelNames(repo: string): Promise<Set<string>> {
  const names = new Set<string>();
  for (let page = 1; ; page++) {
    const batch = await api<Label[]>(
      `/repos/${repo}/labels?per_page=100&page=${page}`,
    );
    batch.forEach((label) => names.add(label.name));
    if (batch.length < 100) return names;
  }
}

async function main(): Promise<void> {
  const repo = required(repository, 'GITHUB_REPOSITORY');
  const event = JSON.parse(
    await readFile(required(eventPath, 'GITHUB_EVENT_PATH'), 'utf8'),
  );
  const issue: IssuePayload | undefined = event.issue;
  if (!issue) throw new Error('No issue on the event payload.');

  const { labels, answered, unknown } = packageLabelsFor(issue.body);

  if (!answered) {
    console.log('No affected-packages answer on this issue; nothing to do.');
    return;
  }
  if (unknown.length) {
    warn(
      `Unrecognised package option(s): ${unknown.join(', ')}. ` +
        'The dropdown and .github/workflows/scripts/package-labels.mts have drifted apart.',
    );
  }
  if (!labels.length) {
    console.log(
      'Answered, but no package could be derived — needs manual triage.',
    );
    return;
  }

  // An edit re-runs this workflow over the whole body, so applying the full answer again
  // would resurrect labels a maintainer removed. Only the packages the edit itself
  // introduced are new signal.
  const selected =
    event.action === 'edited'
      ? labelsAddedByEdit(event.changes, issue.body)
      : labels;
  if (!selected.length) {
    console.log('The edit selected no new package; nothing to add.');
    return;
  }

  const known = await repoLabelNames(repo);
  const missing = selected.filter((label) => !known.has(label));
  if (missing.length) {
    warn(`Label(s) not present in this repo, skipping: ${missing.join(', ')}`);
  }

  const already = new Set((issue.labels ?? []).map((label) => label.name));
  const toAdd = selected.filter(
    (label) => known.has(label) && !already.has(label),
  );

  if (!toAdd.length) {
    console.log('Package labels already present; nothing to add.');
    return;
  }

  await api(`/repos/${repo}/issues/${issue.number}/labels`, {
    method: 'POST',
    body: JSON.stringify({ labels: toAdd }),
  });
  console.log(`Added: ${toAdd.join(', ')}`);
}

main().catch((error) => {
  console.log(
    `::error::${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
