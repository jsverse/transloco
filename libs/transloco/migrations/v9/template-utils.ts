/**
 * Rewrites `translocoRead` out of templates as text rather than through
 * `@angular/compiler`: re-printing the AST would reformat every template the
 * migration touches.
 */

const PREFIX_ATTR = /(?:^|\s)\[?translocoPrefix\]?\s*=/;

/**
 * Captures the whitespace in front so removing a match doesn't leave a double
 * space; the lookahead keeps `translocoReadonly`-style names from matching.
 */
const READ_ATTR =
  /(\s*)(?:\[translocoRead\]|translocoRead)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s/>]+))?(?=[\s/>]|$)/g;

/**
 * Angular's microsyntax maps `read`/`prefix` onto the `translocoRead`/
 * `translocoPrefix` inputs, so `*transloco="let t; read: 'a'"` needs migrating
 * too - and it is the common form in the wild.
 */
const STRUCTURAL_ATTR = /(\*transloco\s*=\s*)("[^"]*"|'[^']*')/g;

const MICRO_READ = /(^|;)(\s*)read(\s*:)/g;
const MICRO_PREFIX = /(^|;)\s*prefix\s*:/;
const MICRO_READ_SEGMENT = /^\s*read\s*:/;

export interface MigrationResult {
  content: string;
  renamed: number;
  /** Dropped because the tag already had a prefix. */
  removed: number;
}

/**
 * Yields the span of every opening tag. Quote state is tracked so a `>` inside
 * an attribute value (`[translocoRead]="a > b ? 'x' : 'y'"`) doesn't end it.
 */
function* iterateTags(html: string): Generator<{ start: number; end: number }> {
  let index = 0;

  while (index < html.length) {
    const open = html.indexOf('<', index);
    if (open === -1) return;

    // Skip comments, doctypes and closing tags.
    if (!/[a-zA-Z]/.test(html[open + 1] ?? '')) {
      index = open + 1;
      continue;
    }

    let cursor = open + 1;
    let quote: string | null = null;

    while (cursor < html.length) {
      const char = html[cursor];
      if (quote) {
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === '>') {
        break;
      }
      cursor++;
    }

    // Unterminated tag - stop rather than guess where it ends.
    if (cursor >= html.length) return;

    yield { start: open, end: cursor + 1 };
    index = cursor + 1;
  }
}

/** Rewrites the `read:` key inside one `*transloco` microsyntax value. */
function migrateMicrosyntax(value: string): MigrationResult {
  MICRO_READ.lastIndex = 0;
  if (!MICRO_READ.test(value))
    return { content: value, renamed: 0, removed: 0 };

  // Prefix already won in v8, so a value carrying both loses the `read` segment
  // rather than gaining a duplicate `prefix`.
  if (MICRO_PREFIX.test(value)) {
    const segments = value.split(';');
    const kept = segments.filter(
      (segment) => !MICRO_READ_SEGMENT.test(segment),
    );

    return {
      content: kept.join(';'),
      renamed: 0,
      removed: segments.length - kept.length,
    };
  }

  let renamed = 0;
  MICRO_READ.lastIndex = 0;
  const content = value.replace(
    MICRO_READ,
    (_match, separator: string, spacing: string, colon: string) => {
      renamed++;

      return `${separator}${spacing}prefix${colon}`;
    },
  );

  return { content, renamed, removed: 0 };
}

function migrateTag(tag: string): MigrationResult {
  // v8 resolved `this.prefix || this.inlineRead`, so renaming a read on a tag
  // that already has a prefix would emit a duplicate attribute - a parse error.
  const hasPrefix = PREFIX_ATTR.test(tag);
  let renamed = 0;
  let removed = 0;

  let content = tag.replace(READ_ATTR, (match: string) => {
    if (hasPrefix) {
      removed++;

      return '';
    }

    renamed++;

    return match.replace('translocoRead', 'translocoPrefix');
  });

  STRUCTURAL_ATTR.lastIndex = 0;
  content = content.replace(
    STRUCTURAL_ATTR,
    (_match, attribute: string, quoted: string) => {
      const quote = quoted[0];
      const result = migrateMicrosyntax(quoted.slice(1, -1));
      renamed += result.renamed;
      removed += result.removed;

      return `${attribute}${quote}${result.content}${quote}`;
    },
  );

  return { content, renamed, removed };
}

function mayContainRead(source: string): boolean {
  return source.includes('translocoRead') || source.includes('*transloco');
}

/**
 * Rewrites both forms in an HTML document. `null` when there is nothing to
 * migrate, so callers can skip writing the file back.
 */
export function migrateTemplate(html: string): MigrationResult | null {
  if (!mayContainRead(html)) return null;

  let content = '';
  let cursor = 0;
  let renamed = 0;
  let removed = 0;

  for (const { start, end } of iterateTags(html)) {
    const tag = html.slice(start, end);
    if (!mayContainRead(tag)) continue;

    const result = migrateTag(tag);
    if (result.renamed === 0 && result.removed === 0) continue;

    content += html.slice(cursor, start) + result.content;
    cursor = end;
    renamed += result.renamed;
    removed += result.removed;
  }

  if (renamed === 0 && removed === 0) return null;

  return { content: content + html.slice(cursor), renamed, removed };
}

const TEMPLATE_PROP = /\btemplate\s*:\s*/g;

/**
 * End index of the string literal opening at `start`, or `-1` if unterminated.
 * Skips `${...}` so a backtick nested in an expression doesn't end the scan.
 */
function findLiteralEnd(source: string, start: number): number {
  const quote = source[start];
  let cursor = start + 1;

  while (cursor < source.length) {
    const char = source[cursor];

    if (char === '\\') {
      cursor += 2;
      continue;
    }

    if (quote === '`' && char === '$' && source[cursor + 1] === '{') {
      let depth = 1;
      cursor += 2;
      while (cursor < source.length && depth > 0) {
        if (source[cursor] === '{') depth++;
        else if (source[cursor] === '}') depth--;
        cursor++;
      }
      continue;
    }

    if (char === quote) return cursor;

    cursor++;
  }

  return -1;
}

export interface InlineTemplateResult extends MigrationResult {
  /** Literals that look migratable but could not be bounded safely. */
  skipped: number;
}

/**
 * Rewrites inline `template:` literals only, never the surrounding source, so
 * a plain string like `'translocoRead'` elsewhere in the file is left alone.
 */
export function migrateInlineTemplates(
  source: string,
): InlineTemplateResult | null {
  if (!mayContainRead(source)) return null;

  let content = '';
  let cursor = 0;
  let renamed = 0;
  let removed = 0;
  let skipped = 0;

  TEMPLATE_PROP.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TEMPLATE_PROP.exec(source)) !== null) {
    const quoteIndex = match.index + match[0].length;
    const quote = source[quoteIndex];
    if (quote !== '`' && quote !== "'" && quote !== '"') continue;

    const end = findLiteralEnd(source, quoteIndex);

    if (end === -1) {
      if (mayContainRead(source.slice(quoteIndex))) skipped++;
      continue;
    }

    const literal = source.slice(quoteIndex + 1, end);
    const result = migrateTemplate(literal);
    if (!result) continue;

    content += source.slice(cursor, quoteIndex + 1) + result.content;
    cursor = end;
    renamed += result.renamed;
    removed += result.removed;
    TEMPLATE_PROP.lastIndex = end;
  }

  if (renamed === 0 && removed === 0 && skipped === 0) return null;

  return { content: content + source.slice(cursor), renamed, removed, skipped };
}
