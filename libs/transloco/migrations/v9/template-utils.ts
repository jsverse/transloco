/**
 * Rewrites `translocoRead` out of templates.
 *
 * Both parsers below are used for *positions* only - the original text is
 * spliced at the offsets they report, so formatting survives byte for byte.
 * Re-printing an AST would reformat every template the migration touches, and
 * matching on raw text - the obvious middle ground - cannot tell an attribute
 * from the same word sitting inside another attribute's value.
 */

import { loadCompiler, loadTypeScript } from './lazy-deps';

type CompilerModule = NonNullable<ReturnType<typeof loadCompiler>>;
type TypeScriptModule = NonNullable<ReturnType<typeof loadTypeScript>>;

/** The v8 input and the v9 input that replaces it. */
const READ_INPUT = 'translocoRead';
const PREFIX_INPUT = 'translocoPrefix';

/** Their microsyntax spellings inside `*transloco="..."`. */
const READ_KEY = 'read';
const PREFIX_KEY = 'prefix';

/** Only the offsets are ever read, so this is all the span shape we need. */
interface Span {
  start: { offset: number };
  end: { offset: number };
}

/**
 * Structural stand-in for `TmplAstBoundAttribute` / `TmplAstTextAttribute`.
 * A text attribute carries its literal `value` as a string; a bound one holds
 * an expression AST there instead, which is how the two are told apart without
 * naming classes that have been reshaped between supported compiler versions.
 */
interface Binding {
  name: string;
  keySpan: Span;
  sourceSpan: Span;
  valueSpan?: Span;
  value?: unknown;
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

export interface MigrationResult {
  content: string;
  renamed: number;
  /** Dropped because the same directive already had a prefix. */
  removed: number;
  /** Templates that look migratable but could not be parsed. */
  skipped: number;
  /** Dropped where v8 could still have fallen back to `read` at runtime. */
  ambiguous: number;
}

/**
 * What v8's `this.prefix || this.inlineRead` would have resolved to.
 *
 * `none` means the prefix was falsy and `read` won, so the read is the value
 * worth keeping. `ambiguous` means only the running application could tell.
 */
type PrefixState = 'none' | 'static' | 'ambiguous';

/** Expressions that are empty no matter what the application does. */
const EMPTY_EXPRESSIONS = new Set(["''", '""', '``']);

/** Cheap gate so the parser only runs on files that could possibly match. */
function mayContainRead(source: string): boolean {
  return source.includes(READ_INPUT) || source.includes('*transloco');
}

/**
 * Whether a source that failed to parse is worth telling the user about. A
 * template with no hint of `read` is skipped in silence.
 */
function looksMigratable(source: string): boolean {
  return source.includes(READ_INPUT) || /\bread\s*:/.test(source);
}

function unparsed(content: string): MigrationResult {
  return { content, renamed: 0, removed: 0, skipped: 1, ambiguous: 0 };
}

function isBinding(value: unknown): value is Binding {
  const candidate = value as Binding | null;

  return (
    !!candidate &&
    typeof candidate === 'object' &&
    typeof candidate.name === 'string' &&
    !!candidate.keySpan &&
    !!candidate.sourceSpan
  );
}

function bindingsAt(record: Record<string, unknown>, key: string): Binding[] {
  const value = record[key];

  return Array.isArray(value) ? value.filter(isBinding) : [];
}

/** Span-ish keys hold no child nodes, so walking into them is wasted work. */
const NON_STRUCTURAL = /Span$|^i18n$|^file$|^start$|^end$/;

/**
 * Groups every binding by the directive instance that owns it.
 *
 * An element's own attributes and the microsyntax of a structural directive on
 * that same element are separate instances, so each resolves `prefix || read`
 * on its own and has to be judged separately.
 *
 * The walk is deliberately structural rather than `instanceof`-based: the
 * migration runs against whatever `@angular/compiler` the workspace has, and
 * the node classes have been reshaped between supported versions.
 */
function collectGroups(
  node: unknown,
  groups: Binding[][],
  seen: Set<object>,
): void {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);

  if (Array.isArray(node)) {
    for (const child of node) collectGroups(child, groups, seen);

    return;
  }

  const record = node as Record<string, unknown>;

  const own = [
    ...bindingsAt(record, 'attributes'),
    ...bindingsAt(record, 'inputs'),
  ];
  if (own.length) groups.push(own);

  const structural = bindingsAt(record, 'templateAttrs');
  if (structural.length) groups.push(structural);

  for (const [key, value] of Object.entries(record)) {
    if (NON_STRUCTURAL.test(key)) continue;
    if (value && typeof value === 'object') collectGroups(value, groups, seen);
  }
}

function textOf(source: string, span: Span): string {
  return source.slice(span.start.offset, span.end.offset);
}

/**
 * Renames the key in place. The key span covers the bare input name in every
 * spelling - `translocoRead`, `[translocoRead]`, `bind-translocoRead` - and the
 * bare `read` in microsyntax, so the replacement follows from what it points at.
 */
function renameEdit(source: string, read: Binding): Edit {
  const key = textOf(source, read.keySpan);

  return {
    start: read.keySpan.start.offset,
    end: read.keySpan.end.offset,
    text: key === READ_KEY ? PREFIX_KEY : PREFIX_INPUT,
  };
}

/**
 * Drops the binding entirely, along with the separator that joined it to its
 * neighbour.
 *
 * A microsyntax span already swallows its trailing separator, so nothing more
 * is needed there. When it doesn't - the `read` key came last - the preceding
 * separator is taken instead, otherwise the value would end on a dangling `;`.
 */
function removalEdit(source: string, read: Binding): Edit {
  const end = read.sourceSpan.end.offset;
  let start = read.sourceSpan.start.offset;

  if (!/[;,]\s*$/.test(textOf(source, read.sourceSpan))) {
    while (start > 0 && /\s/.test(source[start - 1])) start--;

    if (start > 0 && /[;,]/.test(source[start - 1])) {
      start--;
      while (start > 0 && /\s/.test(source[start - 1])) start--;
    }
  }

  return { start, end, text: '' };
}

/**
 * Decides what v8 would have done with the prefix sitting next to a `read`.
 *
 * v8 resolved `this.prefix || this.inlineRead`, so an empty prefix fell through
 * to the read rather than winning - which makes dropping the read on an empty
 * prefix a silent behaviour change.
 */
function classifyPrefix(
  source: string,
  prefix: Binding | undefined,
): PrefixState {
  if (!prefix) return 'none';

  // A text attribute carries its literal value, so the fallback is decidable.
  if (typeof prefix.value === 'string')
    return prefix.value === '' ? 'none' : 'static';

  const expression = prefix.valueSpan
    ? textOf(source, prefix.valueSpan).trim()
    : '';

  if (expression === '' || EMPTY_EXPRESSIONS.has(expression)) return 'none';

  // A bound prefix can still evaluate to undefined, which v8 resolved to the
  // read. Nothing static can tell, so the caller reports it instead.
  return 'ambiguous';
}

function applyEdits(source: string, edits: Edit[]): string {
  const ordered = [...edits].sort((a, b) => a.start - b.start);
  let content = '';
  let cursor = 0;

  for (const edit of ordered) {
    if (edit.start < cursor) continue;
    content += source.slice(cursor, edit.start) + edit.text;
    cursor = edit.end;
  }

  return content + source.slice(cursor);
}

/**
 * Collects the edits for one parsed template. `null` when the source could not
 * be parsed, which the callers turn into a skip.
 */
function templateEdits(
  source: string,
  offset: number,
  compiler: CompilerModule,
): {
  edits: Edit[];
  renamed: number;
  removed: number;
  ambiguous: number;
} | null {
  let parsed;

  try {
    parsed = compiler.parseTemplate(source, 'transloco-migration.html', {
      preserveWhitespaces: true,
    });
  } catch {
    return null;
  }

  if (parsed.errors?.length) return null;

  const groups: Binding[][] = [];
  collectGroups(parsed.nodes, groups, new Set());

  const edits: Edit[] = [];
  let renamed = 0;
  let removed = 0;
  let ambiguous = 0;

  const shift = (edit: Edit): Edit => ({
    start: edit.start + offset,
    end: edit.end + offset,
    text: edit.text,
  });

  for (const group of groups) {
    const reads = group.filter((binding) => binding.name === READ_INPUT);
    if (!reads.length) continue;

    const prefix = group.find((binding) => binding.name === PREFIX_INPUT);
    const state = classifyPrefix(source, prefix);

    for (const read of reads) {
      if (state === 'none') {
        edits.push(shift(renameEdit(source, read)));
        renamed++;
        continue;
      }

      // A directive carrying a real prefix already ignored the read in v8, so
      // renaming would emit a duplicate binding rather than restore anything.
      edits.push(shift(removalEdit(source, read)));
      removed++;
      if (state === 'ambiguous') ambiguous++;
    }

    // The read has just taken the prefix's name, so the empty prefix that let
    // it win in the first place has to go with it.
    if (state === 'none' && prefix)
      edits.push(shift(removalEdit(source, prefix)));
  }

  return { edits, renamed, removed, ambiguous };
}

/**
 * Rewrites both forms in an HTML document. `null` when there is nothing to
 * migrate, so callers can skip writing the file back.
 */
export function migrateTemplate(html: string): MigrationResult | null {
  if (!mayContainRead(html)) return null;

  const compiler = loadCompiler();
  if (!compiler) return looksMigratable(html) ? unparsed(html) : null;

  const result = templateEdits(html, 0, compiler);
  if (!result) return looksMigratable(html) ? unparsed(html) : null;

  if (!result.renamed && !result.removed) return null;

  return {
    content: applyEdits(html, result.edits),
    renamed: result.renamed,
    removed: result.removed,
    skipped: 0,
    ambiguous: result.ambiguous,
  };
}

/**
 * The static stretches of a template literal, as offsets into the file.
 *
 * Everything else - the `${...}` holes - is masked out before parsing, which
 * keeps every offset identical to the original source while hiding expressions
 * the template parser has no business reading.
 */
function staticRanges(
  literal: import('typescript').Node,
  ts: TypeScriptModule,
): Array<[number, number]> {
  if (
    ts.isStringLiteral(literal) ||
    ts.isNoSubstitutionTemplateLiteral(literal)
  )
    return [[literal.getStart() + 1, literal.getEnd() - 1]];

  if (!ts.isTemplateExpression(literal)) return [];

  // A head or middle token ends with the two characters `${`; a tail ends with
  // the closing backtick. Each one opens with a single quote-ish character.
  const ranges: Array<[number, number]> = [
    [literal.head.getStart() + 1, literal.head.getEnd() - 2],
  ];

  for (const span of literal.templateSpans) {
    const token = span.literal;
    const trailing = ts.isTemplateTail(token) ? 1 : 2;
    ranges.push([token.getStart() + 1, token.getEnd() - trailing]);
  }

  return ranges;
}

/** Blanks every character outside `ranges`, preserving length and offsets. */
function maskOutside(
  source: string,
  from: number,
  to: number,
  ranges: Array<[number, number]>,
): string {
  const chars = new Array<string>(to - from).fill(' ');

  for (const [start, end] of ranges) {
    for (let index = start; index < end; index++) {
      chars[index - from] = source[index];
    }
  }

  return chars.join('');
}

/**
 * Whether this `template:` property really belongs to a decorator's metadata
 * object, rather than being a plain object property that happens to share the
 * name - or the word `template:` sitting inside a string or a comment.
 */
function isDecoratorMetadata(
  property: import('typescript').PropertyAssignment,
  ts: TypeScriptModule,
): boolean {
  const object = property.parent;
  if (!ts.isObjectLiteralExpression(object)) return false;

  const call = object.parent;

  return (
    !!call &&
    ts.isCallExpression(call) &&
    call.arguments.some((argument) => argument === object) &&
    ts.isDecorator(call.parent)
  );
}

/**
 * Rewrites inline `template:` literals only, never the surrounding source, so
 * a plain string like `'translocoRead'` elsewhere in the file is left alone.
 */
export function migrateInlineTemplates(source: string): MigrationResult | null {
  if (!mayContainRead(source)) return null;

  const ts = loadTypeScript();
  const compiler = loadCompiler();
  if (!ts || !compiler)
    return looksMigratable(source) ? unparsed(source) : null;

  const file = ts.createSourceFile(
    'transloco-migration.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  const edits: Edit[] = [];
  let renamed = 0;
  let removed = 0;
  let skipped = 0;
  let ambiguous = 0;

  const visit = (node: import('typescript').Node): void => {
    if (
      ts.isPropertyAssignment(node) &&
      (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
      node.name.text === 'template' &&
      isDecoratorMetadata(node, ts)
    ) {
      const literal = node.initializer;
      const ranges = staticRanges(literal, ts);

      if (ranges.length) {
        const from = literal.getStart();
        const to = literal.getEnd();
        const masked = maskOutside(source, from, to, ranges);

        if (mayContainRead(masked)) {
          const result = templateEdits(masked, from, compiler);

          if (!result) {
            if (looksMigratable(masked)) skipped++;
          } else {
            edits.push(...result.edits);
            renamed += result.renamed;
            removed += result.removed;
            ambiguous += result.ambiguous;
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(file, visit);

  if (!renamed && !removed && !skipped) return null;

  return {
    content: applyEdits(source, edits),
    renamed,
    removed,
    skipped,
    ambiguous,
  };
}
