/**
 * Checks that keys-manager still extracts every key against a given
 * `@angular/compiler` / `typescript` pair, since the workspace only ever
 * installs one version of each.
 *
 * Packs the built library into a throwaway project rather than swapping the
 * root dependency: an older `@angular/compiler` breaks the dev toolchain first
 * (`@analogjs/vite-plugin-angular` needs Angular >=21).
 *
 *   nx build transloco-keys-manager
 *   node tools/scripts/verify-keys-manager-compat.mts --angular=20 --typescript=5.8
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, value] = arg.slice(2).split('=');

      return [key, value] as const;
    }),
);

const angularVersion = args.get('angular');
const typescriptVersion = args.get('typescript');

if (!angularVersion || !typescriptVersion) {
  console.error(
    'Usage: verify-keys-manager-compat.mts --angular=<range> --typescript=<range>',
  );
  process.exit(1);
}

const repoRoot = process.cwd();
const distDir = join(repoRoot, 'dist', 'libs', 'transloco-keys-manager');

/**
 * Every template feature whose AST the extractors walk. `@switch` and the
 * literal-map pipe params are the two that changed in 21.1; the rest are here
 * to catch a future reshape of any other block.
 */
const TEMPLATE = `
<ng-container *transloco="let t; prefix: 'home'">
  @switch (cond) {
    @case (a) { <p>{{ t('switchCase') }}</p> }
    @default { <p>{{ t('switchDefault') }}</p> }
  }
  @if (x) { <p>{{ t('inIf') }}</p> } @else { <p>{{ t('inElse') }}</p> }
  @for (i of list; track i) {
    @switch (i) { @case (a) { <p>{{ t('nestedSwitch') }}</p> } }
  } @empty { <p>{{ t('inEmpty') }}</p> }
  @defer (on viewport) { <p>{{ t('inDefer') }}</p> }
  @placeholder { <p>{{ t('inPlaceholder') }}</p> }
  @loading { <p>{{ t('inLoading') }}</p> }
  @error { <p>{{ t('inError') }}</p> }
  <p>{{ t('plain') }}</p>
</ng-container>
<ng-template transloco let-x translocoPrefix="tpl">{{ x('attrForm') }}</ng-template>
<a [title]="'pipeKey' | transloco:{ a: 'x', b: { c: 1 } }"></a>
`;

/**
 * Sharing one `@case` body across several labels is 21.1-only syntax - it is
 * the reason the AST grew case groups - and is a parse error before that, so it
 * lives in its own file and is only added where it compiles.
 */
const GROUPED_CASES_TEMPLATE = `
<ng-container *transloco="let t; prefix: 'grouped'">
  @switch (cond) {
    @case (a) @case (b) { <p>{{ t('sharedBody') }}</p> }
    @case (c) { <p>{{ t('ownBody') }}</p> }
  }
</ng-container>
`;

const SOURCE = `
import { translate, TranslocoService } from '@jsverse/transloco';

export class Greeter {
  constructor(private service: TranslocoService) {}
  a() { return translate('tsPure'); }
  b() { return this.service.translate('tsService'); }
  c() { return this.service.selectTranslate('tsSelect'); }
}
`;

const EXPECTED = [
  'home.inDefer',
  'home.inElse',
  'home.inEmpty',
  'home.inError',
  'home.inIf',
  'home.inLoading',
  'home.inPlaceholder',
  'home.nestedSwitch',
  'home.plain',
  'home.switchCase',
  'home.switchDefault',
  'pipeKey',
  'tpl.attrForm',
  'tsPure',
  'tsSelect',
  'tsService',
];

const GROUPED_CASES_EXPECTED = ['grouped.ownBody', 'grouped.sharedBody'];

/** Case groups landed in 21.1. */
function supportsGroupedCases(version: string): boolean {
  const [major, minor] = version.split('.').map(Number);

  return major > 21 || (major === 21 && minor >= 1);
}

function run(command: string, commandArgs: string[], cwd: string) {
  return execFileSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
}

/** Flattens the generated translation file into dot-separated key paths. */
function flatten(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    return entry !== null && typeof entry === 'object'
      ? flatten(entry as Record<string, unknown>, path)
      : [path];
  });
}

const project = mkdtempSync(join(tmpdir(), 'tkm-compat-'));
console.log(
  `Verifying keys-manager against @angular/compiler@${angularVersion} + typescript@${typescriptVersion}`,
);
console.log(`Scratch project: ${project}`);

// Pack so the check runs against the published layout, bin included.
const packOutput = run(
  'npm',
  ['pack', distDir, '--pack-destination', project],
  repoRoot,
);
const tarball = join(project, packOutput.trim().split('\n').pop()!);

mkdirSync(join(project, 'src'), { recursive: true });
writeFileSync(join(project, 'src', 'app.html'), TEMPLATE);
writeFileSync(join(project, 'src', 'app.ts'), SOURCE);
writeFileSync(
  join(project, 'package.json'),
  JSON.stringify(
    { name: 'tkm-compat', version: '1.0.0', private: true },
    null,
    2,
  ),
);

console.log('Installing...');
run(
  'npm',
  [
    'install',
    tarball,
    `@angular/compiler@${angularVersion}`,
    `typescript@${typescriptVersion}`,
    '--no-audit',
    '--no-fund',
  ],
  project,
);

const resolved = (name: string) =>
  JSON.parse(
    readFileSync(join(project, 'node_modules', name, 'package.json'), 'utf8'),
  ).version;
const resolvedAngular = resolved('@angular/compiler');
console.log(
  `Resolved @angular/compiler@${resolvedAngular}, typescript@${resolved('typescript')}`,
);

// Written after the install so the real resolved version decides, not the range.
const grouped = supportsGroupedCases(resolvedAngular);
const expected = [...EXPECTED];
if (grouped) {
  writeFileSync(join(project, 'src', 'grouped.html'), GROUPED_CASES_TEMPLATE);
  expected.push(...GROUPED_CASES_EXPECTED);
}
console.log(
  grouped
    ? 'Including grouped @case bodies (Angular >=21.1).'
    : 'Skipping grouped @case bodies - not valid syntax before Angular 21.1.',
);

run(
  join(project, 'node_modules', '.bin', 'transloco-keys-manager'),
  ['extract', '--input', 'src', '--output', 'i18n', '--langs', 'en'],
  project,
);

const generated = JSON.parse(
  readFileSync(join(project, 'i18n', 'en.json'), 'utf8'),
);
const actual = flatten(generated).sort();

// Both directions: an AST shim that duplicates a node, or walks into one it
// should not, adds keys rather than losing them - and a missing-only check
// would call that a pass.
const missing = expected.filter((key) => !actual.includes(key));
const unexpected = actual.filter((key) => !expected.includes(key));

if (missing.length || unexpected.length) {
  if (missing.length) {
    console.error(
      `\nMissing ${missing.length} expected key(s): ${missing.join(', ')}`,
    );
  }

  if (unexpected.length) {
    console.error(
      `\nExtracted ${unexpected.length} unexpected key(s): ${unexpected.join(', ')}`,
    );
  }

  console.error(`Expected:  ${JSON.stringify(expected.slice().sort())}`);
  console.error(`Extracted: ${JSON.stringify(actual)}`);
  process.exit(1);
}

console.log(`\nExactly the ${expected.length} expected keys were extracted.`);
