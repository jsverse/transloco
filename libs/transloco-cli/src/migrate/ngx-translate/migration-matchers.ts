import { applyMatcher } from './apply-matcher.js';

/** An attribute of an element, with its value, quoted or not. */
const ATTRIBUTE = `[^\\s=<>"'/]+(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s"'<>]+))?`;
/** A `translate` attribute without a value, between the others of its element. */
const bareTranslate = new RegExp(
  `<[\\w-]+(?:\\s+${ATTRIBUTE})*?\\s+(translate)(?!\\s*=)(?=[\\s/>])`,
  'g',
);

const PIPE_CONTENT_REGEX = `\\s*([^}\\r\\n]*?\\|)\\s*(translate)\\b[^\\r\\n]*?`;
export const PIPE_REGEX = `{{${PIPE_CONTENT_REGEX}}}`;
export const PIPE_IN_BINDING_REGEX = `\\]=('|")${PIPE_CONTENT_REGEX}\\1`;

export interface MatcherDef {
  /** What the names of the files it applies to end with, below the input folder. */
  files: string;
  /** What the names of the files it leaves out end with. */
  exclude?: string[];
  from: RegExp;
  to: string | ((match: string, ...args: string[]) => string);
  /** What can't be migrated in the content of a file, by the offset it starts at. */
  warn?: (content: string) => MatcherWarning[];
}

export interface MatcherWarning {
  index: number;
  message: string;
}

export interface Matcher {
  matchers: MatcherDef[];
  step: string;
}

// TODO refactor migration to be AST based
export function generateMatchers() {
  // Declaration files are never migrated. The spec files go through the
  // modules and the imports, and through `specs` last.
  const tsFiles = { files: '.ts', exclude: ['.d.ts'] };
  const noSpecFiles = { files: '.ts', exclude: ['.spec.ts', '.d.ts'] };

  // An attribute of its own, so not `data-translate`, and not the `translate`
  // attribute of HTML, whose values are yes and no.
  // Its value is anything but its quote: a key, a string or an object.
  const directive = {
    files: '.html',
    from: /(?<=\s)(translate|\[translate(?:Params)?\])=("|')(?!(?:yes|no)\2)(?:(?!\2)[^])*\2/gm,
    to: (match: string) => match.replace('translate', 'transloco'),
    warn: (content: string) =>
      [...content.matchAll(bareTranslate)].map((match) => ({
        index: match.index + match[0].length - match[1].length,
        message: `The translate attribute without a value isn't migrated, use transloco="key" or the pipe`,
      })),
  };

  // Only the name of the pipe, never a `translate` in a key or a string.
  const [pipe, pipeInBinding] = [
    new RegExp(PIPE_REGEX, 'gm'),
    new RegExp(PIPE_IN_BINDING_REGEX, 'gm'),
  ].map((regex) => ({
    files: '.html',
    from: regex,
    to: (match: string) => match.replace(/(\|\s*)translate\b/g, '$1transloco'),
  }));

  // The template of a component, written in its source, is a template like
  // the others. One the migration can't read keeps the ngx-translate symbols
  // of the templates, see `modules` and `imports`.
  const inlineTemplates = {
    ...tsFiles,
    from: /[^]+/g,
    to: (content: string) =>
      inlineTemplatesOf(content)
        .reverse()
        .reduce(
          (result, { start, end, body }) =>
            body === undefined
              ? result
              : result.slice(0, start) +
                [directive, pipe, pipeInBinding].reduce(
                  (migrated, matcher) => applyMatcher(migrated, matcher),
                  body,
                ) +
                result.slice(end),
          content,
        ),
    warn: (content: string) =>
      inlineTemplatesOf(content)
        .filter((template) => template.body === undefined)
        .map(({ start }) => ({
          index: start,
          message: `The inline template can't be migrated, its TranslateModule, TranslatePipe and TranslateDirective are left: migrate it by hand`,
        })),
  };

  const modules = {
    ...tsFiles,
    from: /[^]+/g,
    to: (content: string) =>
      hasUnreadTemplate(content)
        ? content
        : content.replace(
            /(?<![a-zA-Z])TranslateModule(?![^]*from)(\.(forRoot|forChild)\(({[^}]*})*[^)]*\))?/g,
            'TranslocoModule',
          ),
  };

  const imports = {
    ...tsFiles,
    // The whole file: the symbols it imports are merged and their references renamed.
    from: /[^]+/g,
    to: migrateImports,
  };

  const constructorInjection = {
    ...noSpecFiles,
    from: /(?:private|protected|public)\s+(.*?)\s*:\s*(?:TranslateService|TranslatePipe\s*(?:,|\)))/g,
    to: (match: string) =>
      match.replace(/TranslateService|TranslatePipe/g, 'TranslocoService'),
  };

  const serviceUsage = {
    ...noSpecFiles,
    // The whole file: every name the service is injected as.
    from: /[^]+/g,
    to: migrateServiceUsage,
    warn: (content: string) =>
      serviceNames(content).flatMap((name) =>
        [
          ...content.matchAll(
            new RegExp(
              `${nameRegex(name)}\\s*\\.\\s*(${withoutCounterpart.join('|')})(?![\\w$])`,
              'g',
            ),
          ),
        ].map((match) => ({
          index: match.index,
          message: `${name}.${match[1]} has no counterpart in the TranslocoService, migrate it by hand`,
        })),
      ),
  };

  const specs = {
    files: 'spec.ts',
    from: /TranslateService|TranslatePipe/g,
    to: 'TranslocoService',
  };

  const htmlReplacements: Matcher[] = [
    {
      matchers: [directive],
      step: 'directives',
    },
    {
      matchers: [pipe, pipeInBinding],
      step: 'pipes',
    },
  ];
  const tsReplacements: Matcher[] = [
    {
      matchers: [inlineTemplates],
      step: 'inline templates',
    },
    {
      matchers: [modules],
      step: 'modules',
    },
    {
      matchers: [imports],
      step: 'imports',
    },
    {
      matchers: [constructorInjection],
      step: 'constructor injections',
    },
    {
      matchers: [serviceUsage],
      step: 'service usage',
    },
    {
      matchers: [specs],
      step: 'specs',
    },
  ];

  return { htmlReplacements, tsReplacements };
}

/** The ngx-translate symbols that have a Transloco counterpart. */
const counterparts: Record<string, string> = {
  TranslateModule: 'TranslocoModule',
  TranslateService: 'TranslocoService',
  TranslatePipe: 'TranslocoPipe',
  TranslateDirective: 'TranslocoDirective',
};

const placeholder = '\0transloco-import\0';

/**
 * Moves the symbols of the ngx-translate imports that have a counterpart to
 * one import of `@jsverse/transloco`, after the first of them, and
 * renames their references. The ones without a counterpart keep their import,
 * and a symbol the file imports from Transloco already isn't imported twice.
 */
function migrateImports(content: string) {
  // The symbols an inline template the migration can't read may use.
  const leftForTemplates = hasUnreadTemplate(content)
    ? ['TranslateModule', 'TranslatePipe', 'TranslateDirective']
    : [];

  const imported = new Set(
    [
      ...content.matchAll(
        /import\s*{([^}]*)}\s*from\s*('|")@jsverse\/transloco\2/g,
      ),
    ].flatMap(([, names]) => specifiers(names)),
  );
  const added: string[] = [];
  const renamed: string[] = [];
  const add = (specifier: string) => {
    if (!imported.has(specifier) && !added.includes(specifier)) {
      added.push(specifier);
    }
  };
  let placed = false;

  let migrated = content.replace(
    /import\s*{([^}]*)}\s*from\s*('|")(@?ngx-translate(?:\/[^'"]*)?)\2;?(\r?\n)?/g,
    (match, names: string, quote: string, module: string, eol = '') => {
      const all = specifiers(names);
      const others = all.filter((specifier) => {
        const [name, alias] = specifier.split(/\s+as\s+/);
        const counterpart = leftForTemplates.includes(name)
          ? undefined
          : counterparts[name];

        if (!counterpart) return true;

        add(alias ? `${counterpart} as ${alias}` : counterpart);
        if (!alias) renamed.push(name);

        return false;
      });

      if (others.length === all.length) return match;

      const kept = others.length
        ? `import { ${others.join(', ')} } from ${quote}${module}${quote};${eol}`
        : '';
      const first = placed ? '' : placeholder;

      placed = true;

      return kept + first;
    },
  );

  // An injected pipe becomes the service, see `constructorInjection`.
  if (
    renamed.includes('TranslatePipe') &&
    /:\s*TranslatePipe\b/.test(content)
  ) {
    add('TranslocoService');
  }

  for (const name of renamed) {
    // The type of an injected pipe is left to `constructorInjection`.
    const notAType = name === 'TranslatePipe' ? '(?<!:\\s*)' : '';

    migrated = migrated.replace(
      new RegExp(`${notAType}(?<![\\w$.])${name}(?![\\w$])`, 'g'),
      counterparts[name],
    );
  }

  const eol = content.includes('\r\n') ? '\r\n' : '\n';

  return migrated.replace(
    placeholder,
    added.length
      ? `import { ${added.join(', ')} } from '@jsverse/transloco';${eol}`
      : '',
  );
}

/** `a, b as c, type d` => `['a', 'b as c', 'd']` */
function specifiers(names: string) {
  return names
    .split(',')
    .map((name) => name.trim().replace(/^type\s+/, ''))
    .filter(Boolean);
}

/** The calls of the TranslateService and their counterparts. */
const functionsMap: Record<string, string> = {
  instant: 'translate',
  transform: 'translate',
  get: 'selectTranslate',
  stream: 'selectTranslate',
  use: 'setActiveLang',
  set: 'setTranslation',
};

/** The properties of the TranslateService and their counterparts. */
const propsMap: Record<string, string> = {
  currentLang: 'getActiveLang()',
  onLangChange: 'langChanges$',
};

/**
 * The members of the TranslateService the TranslocoService has nothing like.
 * Its `getTranslation` and `setTranslation` take other arguments, but share
 * the names of members of the TranslocoService, so they can't be told apart.
 */
const withoutCounterpart = [
  'addLangs',
  'getLangs',
  'langs',
  'reloadLang',
  'resetLang',
  'getParsedResult',
  'getStreamOnTranslationChange',
  'getBrowserLang',
  'getBrowserCultureLang',
  'defaultLang',
  'onTranslationChange',
  'onDefaultLangChange',
  'translations',
  'currentLoader',
  'compiler',
  'parser',
  'missingTranslationHandler',
  'store',
];

/**
 * The names the file injects the service as, once the imports and the
 * constructor injections are migrated: the members and parameters of its
 * type, and the variables `inject()` gives it to.
 */
function serviceNames(content: string) {
  const names = [
    ...content.matchAll(
      /\b(?:private|protected|public)\s+(?:readonly\s+)?([\w$]+)\s*:\s*TranslocoService\b/g,
    ),
    ...content.matchAll(
      /(#?[\w$]+)\s*(?::\s*TranslocoService\s*)?=\s*inject\(\s*TranslocoService\b/g,
    ),
  ].map(([, name]) => name);

  return [...new Set(names)];
}

/** Where the name is used: on its own or on `this`, never as a member of something else. */
function nameRegex(name: string) {
  return `(?<![\\w$#]|(?<!this)\\.)${name.replace(/[$^.*+?()[\]{}|\\]/g, '\\$&')}`;
}

/**
 * Renames the calls and the properties of the service for every name it is
 * injected as. A `get()` emits once, as it did, with `take(1)`.
 */
function migrateServiceUsage(content: string) {
  let migrated = content;
  let took = false;

  for (const name of serviceNames(content)) {
    const target = nameRegex(name);
    const gets = [
      ...migrated.matchAll(new RegExp(`${target}\\s*\\.\\s*get\\s*\\(`, 'g')),
    ];

    // From the last call, so the offsets of the others hold.
    for (const match of gets.reverse()) {
      const close = closingParen(migrated, match.index + match[0].length - 1);
      const after = migrated.slice(close + 1);

      if (close === -1 || /^\s*\.pipe\(\s*take\(\s*1\s*\)\s*\)/.test(after)) {
        continue;
      }

      migrated = `${migrated.slice(0, close + 1)}.pipe(take(1))${after}`;
      took = true;
    }

    const call = (map: Record<string, string>, func: boolean) =>
      new RegExp(
        `(${target}\\s*\\.\\s*)(${Object.keys(map).join('|')})(?![\\w$])(?=\\s*${func ? '\\(' : '(?!\\()'})`,
        'g',
      );

    migrated = migrated
      .replace(
        call(functionsMap, true),
        (_, on: string, member: string) => `${on}${functionsMap[member]}`,
      )
      .replace(
        call(propsMap, false),
        (_, on: string, member: string) => `${on}${propsMap[member]}`,
      );
  }

  return took ? importTake(migrated) : migrated;
}

/** The offset of the parenthesis closing the one at `open`, past the ones in strings, or -1. */
function closingParen(content: string, open: number) {
  let depth = 0;

  for (let i = open; i < content.length; i++) {
    const char = content[i];

    if (char === "'" || char === '"' || char === '`') {
      // To the end of the string, past its escapes.
      for (i++; i < content.length && content[i] !== char; i++) {
        if (content[i] === '\\') i++;
      }
    } else if (char === '(') {
      depth++;
    } else if (char === ')' && --depth === 0) {
      return i;
    }
  }

  return -1;
}

/** Imports `take` from rxjs, along with the other rxjs symbols of the file, unless it's imported already. */
function importTake(content: string) {
  if (
    /import\s*{[^}]*\btake\b[^}]*}\s*from\s*('|")rxjs(\/operators)?\1/.test(
      content,
    )
  ) {
    return content;
  }

  const rxjs = /import\s*{([^}]*)}\s*from\s*('|")rxjs\2/;

  if (rxjs.test(content)) {
    // Added to the names as they are written, `type` modifiers included.
    return content.replace(rxjs, (match, names: string) =>
      match.replace(`{${names}}`, `{${names.replace(/,?\s*$/, '')}, take }`),
    );
  }

  const imports = [...content.matchAll(/^import\s[^;]*;[^\S\r\n]*(\r?\n)?/gm)];
  const last = imports.at(-1);
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const at = last ? last.index + last[0].length : 0;
  const line = `import { take } from 'rxjs';${eol}`;

  return last && !last[1]
    ? `${content.slice(0, at)}${eol}${line}${content.slice(at)}`
    : `${content.slice(0, at)}${line}${content.slice(at)}`;
}

/**
 * The templates written in the components of the source, from the quote that
 * opens them to the one that closes them. `body` is the content between the
 * quotes, missing when the migration can't read it: an interpolation of a
 * template string, a concatenation, or no string at all.
 */
function inlineTemplatesOf(content: string) {
  const templates: { start: number; end: number; body?: string }[] = [];

  for (const match of templateProperties(content)) {
    const start = match.index + match[0].length;
    const quote = content[start];

    if (quote !== "'" && quote !== '"' && quote !== '`') {
      templates.push({ start: match.index, end: start });
      continue;
    }

    let end = start + 1;

    while (end < content.length && content[end] !== quote) {
      end += content[end] === '\\' ? 2 : 1;
    }

    const body = content.slice(start + 1, end);
    // A translate attribute without a value would be left in a template
    // whose directive is renamed.
    const readable =
      end < content.length &&
      !(quote === '`' && body.includes('${')) &&
      !/^\s*\+/.test(content.slice(end + 1)) &&
      !new RegExp(bareTranslate).test(body);

    templates.push(
      readable
        ? { start: start + 1, end, body }
        : { start: match.index, end: start },
    );
  }

  return templates;
}

/** The `template` properties of the `@Component()` decorators. */
function templateProperties(content: string) {
  return [...content.matchAll(/@Component\s*\(/g)].flatMap((component) => {
    const open = component.index + component[0].length - 1;
    const close = closingParen(content, open);
    const decorator = content.slice(0, close === -1 ? content.length : close);
    const properties = /(?<![\w$.])template\s*:\s*/g;

    properties.lastIndex = open;

    return [...decorator.matchAll(properties)];
  });
}

/** Whether the source has an inline template the migration can't read. */
function hasUnreadTemplate(content: string) {
  return inlineTemplatesOf(content).some(({ body }) => body === undefined);
}
