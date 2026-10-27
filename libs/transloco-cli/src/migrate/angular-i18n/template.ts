import {
  Expansion,
  HtmlParser,
  Text,
  type Attribute,
  type Element,
  type Node,
} from '@angular/compiler';

import { dasherize } from './dasherize.js';

export type Translation = Record<string, unknown>;

/** A text a mark holds, as it goes into the translation. */
export interface Message {
  /** The meaning of the mark, the key goes below it. */
  meaning?: string;
  key: string;
  text: string;
  /** The description of the mark. */
  comment?: string;
  /** The line of the mark, from 1. */
  line: number;
}

export interface TemplateWarning {
  /** The line of the mark, from 1. */
  line: number;
  message: string;
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

/** An element, or a component of the selectorless syntax: what carries attributes. */
type Tag = Pick<
  Element,
  'name' | 'attrs' | 'children' | 'startSourceSpan' | 'endSourceSpan'
>;

/**
 * Takes the Angular i18n marks out of a template: the template with the
 * marked text replaced by `transloco` pipes, and the translations they held.
 *
 * The template is parsed, and only the text of a marked element and the
 * value of a marked attribute are replaced. A mark the migration can't
 * convert, on an element without a text, around other elements or an
 * interpolation, is left as it is with a warning, so is a template that
 * doesn't parse.
 *
 * When a key comes twice with different texts, the first text is kept.
 * `onMessage` is called with every text, the ones not kept too.
 */
export function migrateTemplate(
  template: string,
  onMessage?: (message: Message) => void,
) {
  const { rootNodes, errors } = new HtmlParser().parse(template, 'template', {
    tokenizeExpansionForms: true,
  });
  const translation: Translation = {};
  const warnings: TemplateWarning[] = [];

  if (errors.length) {
    warnings.push({
      line: errors[0].span.start.line + 1,
      message: `The template can't be parsed, it is left as it is: ${errors[0].msg}`,
    });

    return { template, translation, warnings };
  }

  const edits: Edit[] = [];

  const add = (message: Message) => {
    addMessage(translation, message);
    onMessage?.(message);

    return pathOf(message);
  };

  visit(rootNodes, (tag) => migrateTag(template, tag, add, edits, warnings));

  return {
    template: applyEdits(template, edits),
    translation,
    warnings: warnings.sort((a, b) => a.line - b.line),
  };
}

/** Calls `onTag` with every element below the nodes, the ones inside blocks too. */
function visit(nodes: Node[], onTag: (tag: Tag) => void) {
  for (const node of nodes) {
    if ('attrs' in node && 'startSourceSpan' in node) {
      onTag(node as Tag);
    }

    if ('children' in node && Array.isArray(node.children)) {
      visit(node.children, onTag);
    }
  }
}

function migrateTag(
  template: string,
  tag: Tag,
  add: (message: Message) => string,
  edits: Edit[],
  warnings: TemplateWarning[],
) {
  const line = tag.startSourceSpan.start.line + 1;
  const warn = (message: string) => warnings.push({ line, message });

  for (const mark of tag.attrs) {
    if (mark.name === 'i18n') {
      const text = contentOf(template, tag, mark.value);

      if ('reason' in text) {
        warn(`<${tag.name} i18n> is left as it is: ${text.reason}`);
        continue;
      }

      const key = add(messageOf(mark.value, text.text, line));

      edits.push(removal(template, mark), {
        ...text.range,
        text: `{{ ${literal(key)} | transloco }}`,
      });

      continue;
    }

    if (!mark.name.startsWith('i18n-')) continue;

    const name = mark.name.slice('i18n-'.length);
    const attribute = tag.attrs.find((attr) => attr.name === name);
    const text = attribute?.value.trim().replace(/\s+/g, ' ');

    const reason = !attribute
      ? `it has no ${name} attribute`
      : !text
        ? `the ${name} attribute has no text`
        : /{{[^]*?}}/.test(text)
          ? `the ${name} attribute holds an interpolation, translate it by hand with params`
          : undefined;

    if (!attribute || !text || reason) {
      warn(`<${tag.name} ${mark.name}> is left as it is: ${reason}`);
      continue;
    }

    const key = add(messageOf(mark.value, text, line));
    // An ARIA or data attribute is no property of the element.
    const target = /^(aria|data)-/.test(name) ? `attr.${name}` : name;

    edits.push(removal(template, mark), {
      start: attribute.sourceSpan.start.offset,
      end: attribute.sourceSpan.end.offset,
      text: `[${target}]="${literal(key).replace(/"/g, '&quot;')} | transloco"`,
    });
  }
}

/**
 * The text an `i18n` mark translates, with its white space collapsed, and the
 * range of the content holding it, or why there is none the migration can use. An ICU message is kept as it's written,
 * and only with an id, as there's no key to make of it.
 */
function contentOf(
  template: string,
  tag: Tag,
  meta: string,
):
  { text: string; range: { start: number; end: number } } | { reason: string } {
  const range = {
    start: tag.startSourceSpan.end.offset,
    end: tag.endSourceSpan?.start.offset ?? -1,
  };

  if (range.end < range.start) {
    return { reason: 'it has no text' };
  }

  if (
    tag.children.some(
      (child) => !(child instanceof Text || child instanceof Expansion),
    )
  ) {
    return { reason: 'it holds other elements, translate its texts by hand' };
  }

  if (
    tag.children.some(
      (child) => child instanceof Text && /{{[^]*?}}/.test(child.value),
    )
  ) {
    return {
      reason: 'it holds an interpolation, translate it by hand with params',
    };
  }

  if (tag.children.some((child) => child instanceof Expansion)) {
    if (!describe(meta).id) {
      return { reason: 'it holds an ICU message, give it an id (@@id)' };
    }

    const text = template
      .slice(range.start, range.end)
      .trim()
      .replace(/(\r\n|\n|\r)/gm, '');

    return { text, range };
  }

  const text = tag.children
    .map((child) => (child as Text).value)
    .join('')
    .trim()
    .replace(/\s+/g, ' ');

  return text ? { text, range } : { reason: 'it has no text' };
}

/** The meaning, the description and the id of the value of a mark: `meaning|description@@id`. */
function describe(meta: string) {
  const [rest, id] = meta.split('@@');
  const hasId = meta.split('@@').length === 2;
  const parts = meta.split('|');

  if (parts.length === 2) {
    return {
      id: hasId ? id : undefined,
      context: parts[0],
      comment: parts[1].split('@@')[0],
    };
  }

  return {
    id: hasId ? id : undefined,
    comment: meta.startsWith('@@') ? undefined : rest,
  };
}

/** The message of a mark. Its key is the custom id as it's written, or else made of the text. */
function messageOf(meta: string, text: string, line: number): Message {
  const { id, context, comment } = describe(meta);

  return {
    ...(context ? { meaning: context } : {}),
    key: id ?? keyOf(text),
    text,
    ...(comment ? { comment } : {}),
    line,
  };
}

/**
 * The key the template reads the message with. Transloco flattens the
 * translation, so the key below a meaning is read as `meaning.key`.
 */
export function pathOf({ meaning, key }: Pick<Message, 'meaning' | 'key'>) {
  return meaning ? `${meaning}.${key}` : key;
}

/**
 * Adds the message to the translation, below its meaning, unless its key is
 * there already: the first text of a key is the one kept.
 */
export function addMessage(
  translation: Translation,
  { meaning, key, text, comment }: Message,
) {
  const target = meaning ? (translation[meaning] ??= {}) : translation;

  if (typeof target !== 'object' || target === null || key in target) return;

  (target as Translation)[key] = text;
  if (comment) {
    (target as Translation)[`${key}.comment`] = comment;
  }
}

/** The key made of a text: dasherized, without what can't stand in a template string. */
function keyOf(text: string) {
  return dasherize(text)
    .replace(/['"`\\<>&{}]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

/** The key as a string of the template. */
function literal(key: string) {
  return `'${key.replace(/[\\']/g, '\\$&')}'`;
}

/** Removes the attribute, and the white space before it. */
function removal(template: string, attr: Attribute): Edit {
  let start = attr.sourceSpan.start.offset;

  while (start > 0 && /\s/.test(template[start - 1])) start--;

  return { start, end: attr.sourceSpan.end.offset, text: '' };
}

/** The edits never overlap: each one is an attribute, or the content of an element without other elements. */
function applyEdits(template: string, edits: Edit[]) {
  return edits
    .sort((a, b) => b.start - a.start)
    .reduce(
      (result, { start, end, text }) =>
        result.slice(0, start) + text + result.slice(end),
      template,
    );
}
