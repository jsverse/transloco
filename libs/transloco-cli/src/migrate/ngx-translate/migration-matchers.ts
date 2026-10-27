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
  const directive = {
    files: '.html',
    from: /(?<=\s)(translate|\[translate(?:Params)?\])=("|')(?!(?:yes|no)\2)[^"']*\2/gm,
    to: (match: string) => match.replace('translate', 'transloco'),
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

  const modules = {
    ...tsFiles,
    from: /(?<![a-zA-Z])TranslateModule(?![^]*from)(\.(forRoot|forChild)\(({[^}]*})*[^)]*\))?/g,
    to: 'TranslocoModule',
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
    from: /(?=([^]+(?:private|protected|public)\s+([^,:()]+)\s*:\s*(?:TranslocoService\s*(?:,|\)))))\1[^]*/gm,
    to: (match: string, _: string, serviceName: string) => {
      const sanitizedName = serviceName
        .split('')
        .map((char: string) => (['$', '^'].includes(char) ? `\\${char}` : char))
        .join('');
      const functionsMap: Record<string, string> = {
        instant: 'translate',
        transform: 'translate',
        get: 'selectTranslate',
        stream: 'selectTranslate',
        use: 'setActiveLang',
        set: 'setTranslation',
      };
      const propsMap: Record<string, string> = {
        currentLang: 'getActiveLang()',
        onLangChange: 'langChanges$',
      };
      const getTarget = (t: Record<string, string>) => Object.keys(t).join('|');
      const serviceCallRgx = ({
        map,
        func,
      }: {
        map: Record<string, string>;
        func: boolean;
      }) =>
        new RegExp(
          `(?:(?:\\s*|this\\.)${sanitizedName})(?:\\s*\\t*\\r*\\n*)*\\.(?:\\s*\\t*\\r*\\n*)*(${getTarget(
            map,
          )})[\\r\\t\\n\\s]*${func ? '\\(' : '(?!\\()'}`,
          'g',
        );
      return [
        { func: true, map: functionsMap },
        { func: false, map: propsMap },
      ].reduce((acc, curr) => {
        return acc.replace(serviceCallRgx(curr), (str: string) =>
          str.replace(
            new RegExp(getTarget(curr.map)),
            (func: string) => curr.map[func],
          ),
        );
      }, match);
    },
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
        const counterpart = counterparts[name];

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
