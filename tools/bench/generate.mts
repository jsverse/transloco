/**
 * Generates the synthetic Angular project the extraction benchmarks run on,
 * the one described in jsverse/transloco#1011: components made of a
 * `cN.component.ts` and a `cN.component.html`, two thirds of them using
 * `TranslocoService`, `translate()`, `*transloco`, `| transloco` and
 * `@if`/`@for` blocks, the rest plain Angular. Every Transloco component holds
 * 9 keys, so the default 3000 files carry 9000 of them.
 *
 * The output only depends on the arguments: the few things that vary between
 * components come from a seeded generator, so two runs produce the same bytes
 * and timings stay comparable across machines and commits.
 *
 *   node tools/bench/generate.mts                      # 3000 files in tmp/bench/project-3000
 *   node tools/bench/generate.mts --files 10k
 *   node tools/bench/generate.mts --files 30k --out tmp/bench/large
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { assertUsableOptions } from './args.mts';

const usage =
  'Usage: generate.mts [--files <3k|10k|30k|count>] [--out <dir>] [--seed <number>]';

/** Strict, so a misspelled or misplaced argument fails instead of silently falling back to a default. */
function parseArguments() {
  try {
    const { values, tokens } = parseArgs({
      options: {
        files: { type: 'string', default: '3000' },
        out: { type: 'string' },
        seed: { type: 'string', default: '1011' },
        help: { type: 'boolean', short: 'h', default: false },
      },
      strict: true,
      allowPositionals: false,
      tokens: true,
    });

    assertUsableOptions(tokens);

    return values;
  } catch (error) {
    console.error(`${(error as Error).message}\n${usage}`);
    process.exit(1);
  }
}

const args = parseArguments();

/** `3000`, `3k`, `10k` and `30k` alike. */
function parseFileCount(value: string): number {
  const match = /^(\d+)(k?)$/i.exec(value);
  const count = match ? Number(match[1]) * (match[2] ? 1000 : 1) : NaN;

  if (!Number.isInteger(count) || count < 2 || count % 2 !== 0) {
    console.error(
      `--files takes an even number of files, e.g. 3000, 3k, 10k or 30k. Got "${value}".`,
    );
    process.exit(1);
  }

  return count;
}

if (args.help) {
  console.log(usage);
  process.exit(0);
}

const fileCount = parseFileCount(args.files);
const seed = Number(args.seed);

if (!Number.isInteger(seed)) {
  console.error(`--seed takes a whole number. Got "${args.seed}".`);
  process.exit(1);
}

// tmp/ is git ignored, so a generated project never ends up in a commit.
const outDir = resolve(
  args.out || join('tmp', 'bench', `project-${fileCount}`),
);
const componentCount = fileCount / 2;
/** Components per directory, to keep any single one from growing into the thousands. */
const GROUP_SIZE = 100;
const LANGS = ['en', 'es'];

/** mulberry32: small, fast and good enough to vary the generated markup. */
function createRandom(initialSeed: number) {
  let state = initialSeed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(seed);
const WORDS = [
  'orders',
  'invoices',
  'customers',
  'reports',
  'settings',
  'billing',
  'shipping',
  'inventory',
  'payments',
  'support',
];
const pick = () => WORDS[Math.floor(random() * WORDS.length)];

/** Markup without any key, of a length that differs from one component to the next. */
function plainMarkup(): string {
  return Array.from(
    { length: 2 + Math.floor(random() * 4) },
    () => `  <p class="${pick()}">{{ ${pick()}Count }} ${pick()}</p>`,
  ).join('\n');
}

function translocoTemplate(name: string): string {
  return `<section *transloco="let t; prefix: '${name}'">
  <h1>{{ t('title') }}</h1>
  <p>{{ t('subtitle', { count: items.length }) }}</p>
  @if (items.length === 0) {
    <p class="empty">{{ t('empty') }}</p>
  } @else {
    <ul>
      @for (item of items; track item.id) {
        <li>{{ t('item', { name: item.name }) }}</li>
      }
    </ul>
  }
</section>
<input [placeholder]="'${name}.placeholder' | transloco" />
<button [title]="'${name}.tooltip' | transloco" (click)="save()">{{ label }}</button>
${plainMarkup()}
`;
}

function translocoComponent(index: number, name: string): string {
  return `import { Component, inject } from '@angular/core';
import { translate, TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-${name}',
  imports: [TranslocoDirective, TranslocoPipe],
  templateUrl: './${name}.component.html',
})
export class C${index}Component {
  private readonly transloco = inject(TranslocoService);

  readonly loading$ = this.transloco.selectTranslate('${name}.loading');
  items: { id: number; name: string }[] = [];
  label = '${pick()}';

  save() {
    return this.items.length
      ? this.transloco.translate('${name}.saved', { count: this.items.length })
      : translate('${name}.failed');
  }
}
`;
}

function plainTemplate(name: string): string {
  return `<section class="${name}">
  <h1>{{ title }}</h1>
  @if (visible) {
    <p>{{ description }}</p>
  }
${plainMarkup()}
</section>
`;
}

function plainComponent(index: number, name: string): string {
  return `import { Component } from '@angular/core';

@Component({
  selector: 'app-${name}',
  templateUrl: './${name}.component.html',
})
export class C${index}Component {
  title = '${pick()}';
  description = '${pick()} ${pick()}';
  visible = ${random() < 0.5};
}
`;
}

/** Marks a directory as made by this script, which is the only kind it replaces. */
const MARKER = '.transloco-bench-project';

// A directory that is neither empty nor one of ours is somebody's files:
// `--out .` or a mistyped path must never be wiped.
if (existsSync(outDir)) {
  const entries = statSync(outDir).isDirectory() ? readdirSync(outDir) : null;

  if (entries === null || (entries.length > 0 && !entries.includes(MARKER))) {
    console.error(
      `${outDir} exists and was not generated by this script (it has no ${MARKER} file). Remove it yourself or pick another --out.`,
    );
    process.exit(1);
  }

  rmSync(outDir, { recursive: true, force: true });
}

mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, MARKER),
  'Generated by tools/bench/generate.mts, which replaces this directory when it is given as --out.\n',
);

let translocoComponents = 0;
for (let index = 0; index < componentCount; index++) {
  const name = `c${index}`;
  const dir = join(
    outDir,
    'src',
    'app',
    `group-${Math.floor(index / GROUP_SIZE)}`,
  );
  // Two out of every three components use Transloco.
  const usesTransloco = index % 3 !== 2;

  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, `${name}.component.html`),
    usesTransloco ? translocoTemplate(name) : plainTemplate(name),
  );
  writeFileSync(
    join(dir, `${name}.component.ts`),
    usesTransloco
      ? translocoComponent(index, name)
      : plainComponent(index, name),
  );
  translocoComponents += usesTransloco ? 1 : 0;
}

const i18nDir = join(outDir, 'src', 'assets', 'i18n');
mkdirSync(i18nDir, { recursive: true });
for (const lang of LANGS) {
  writeFileSync(join(i18nDir, `${lang}.json`), '{}\n');
}

writeFileSync(
  join(outDir, 'transloco.config.js'),
  `module.exports = {
  rootTranslationsPath: 'src/assets/i18n',
  langs: ${JSON.stringify(LANGS)},
  keysManager: {
    input: 'src/app',
    output: 'src/assets/i18n',
  },
};
`,
);
writeFileSync(
  join(outDir, 'angular.json'),
  `${JSON.stringify(
    {
      version: 1,
      projects: {
        bench: { projectType: 'application', root: '', sourceRoot: 'src' },
      },
    },
    null,
    2,
  )}\n`,
);

console.log(
  `Generated ${fileCount} files (${componentCount} components, ${translocoComponents} of them using Transloco, ${translocoComponents * 9} keys) in ${outDir}`,
);
