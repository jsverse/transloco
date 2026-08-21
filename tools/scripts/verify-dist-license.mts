/**
 * Asserts every released package carries a LICENSE at its publish root.
 *
 * npm always includes a root LICENSE in the tarball regardless of the `files`
 * field, so landing it in `dist/libs/<project>/` is the whole requirement — but
 * nothing in the build fails when it is missing. That is how six packages
 * shipped unlicensed up to 8.4.0 (see #986): the `@nx/js:tsc` `assets` globs
 * were `*.md` only, and LICENSE is extensionless.
 *
 * The project list is read from `nx.json` `release.projects` rather than
 * hardcoded, so a newly released package is covered the day it is added. The
 * publish root mirrors the `nx-release-publish` `packageRoot` default
 * (`dist/{projectRoot}`) configured in the same file.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const nxJson = JSON.parse(readFileSync('nx.json', 'utf8'));
const projects: string[] = nxJson.release?.projects ?? [];

if (projects.length === 0) {
  console.error('No `release.projects` found in nx.json — nothing to verify.');
  process.exit(1);
}

const expected = readFileSync('LICENSE', 'utf8');
const missing: string[] = [];
const mismatched: string[] = [];

for (const project of projects) {
  const licensePath = join('dist', 'libs', project, 'LICENSE');

  if (!existsSync(licensePath)) {
    missing.push(licensePath);
  } else if (readFileSync(licensePath, 'utf8') !== expected) {
    // Guard the contents as well as the presence: a per-package copy that
    // drifted from the root one is the failure this consolidation removed.
    mismatched.push(licensePath);
  }
}

if (missing.length > 0 || mismatched.length > 0) {
  for (const path of missing) {
    console.error(`✖ missing LICENSE: ${path}`);
  }
  for (const path of mismatched) {
    console.error(`✖ LICENSE differs from the workspace root copy: ${path}`);
  }
  console.error(
    `\n${missing.length + mismatched.length} of ${projects.length} released packages failed the LICENSE check.`,
  );
  process.exit(1);
}

console.log(`✔ LICENSE present in all ${projects.length} released packages.`);
