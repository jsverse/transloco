import {
  createSourceFile,
  forEachChild,
  isArrayLiteralExpression,
  isCallExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAssignment,
  ScriptTarget,
  type Node,
  type ObjectLiteralExpression,
} from 'typescript';

const PIPE_CONTENT_REGEX = `\\s*([^}\\r\\n]*?\\|)\\s*(translate)[^\\r\\n]*?`;
export const PIPE_REGEX = `{{${PIPE_CONTENT_REGEX}}}`;
export const PIPE_IN_BINDING_REGEX = `\\]=('|")${PIPE_CONTENT_REGEX}\\1`;

const DECLARABLES = ['TranslocoDirective', 'TranslocoPipe'];

/** An NgModule metadata property holding an array literal. */
function arrayProperty(object: ObjectLiteralExpression, key: string) {
  const property = object.properties.find(
    (candidate) =>
      isPropertyAssignment(candidate) &&
      isIdentifier(candidate.name) &&
      candidate.name.text === key,
  );

  if (
    !property ||
    !isPropertyAssignment(property) ||
    !isArrayLiteralExpression(property.initializer)
  )
    return undefined;

  return property.initializer;
}

function isNgModuleMetadata(object: ObjectLiteralExpression) {
  const call = object.parent;

  return (
    !!call &&
    isCallExpression(call) &&
    isIdentifier(call.expression) &&
    call.expression.text === 'NgModule'
  );
}

/**
 * `TranslateModule` could be re-exported by an NgModule that never imported it.
 * `TranslocoDirective` and `TranslocoPipe` cannot: an NgModule may only export
 * a standalone declarable it imports, or the build fails with NG6004. So once
 * the modules step has rewritten the exports, the same names are added to the
 * sibling `imports`.
 */
export function importReExportedDeclarables(content: string): string {
  if (!DECLARABLES.some((name) => content.includes(name))) return content;

  const file = createSourceFile(
    'ngx-migrate.ts',
    content,
    ScriptTarget.Latest,
    true,
  );
  const edits: { position: number; text: string }[] = [];

  const visit = (node: Node): void => {
    forEachChild(node, visit);

    if (!isObjectLiteralExpression(node) || !isNgModuleMetadata(node)) return;

    const exported = arrayProperty(node, 'exports');
    if (!exported) return;

    const texts = exported.elements.map((element) => element.getText());
    const needed = DECLARABLES.filter((name) => texts.includes(name));
    if (!needed.length) return;

    const imported = arrayProperty(node, 'imports');
    const hasImportsKey = node.properties.some(
      (candidate) =>
        isPropertyAssignment(candidate) &&
        isIdentifier(candidate.name) &&
        candidate.name.text === 'imports',
    );
    // An `imports` that is not an array literal, or a spread that may carry one
    // of its own, cannot be extended in place - that is left to the developer.
    if (hasImportsKey && !imported) return;
    if (node.properties.some((candidate) => !isPropertyAssignment(candidate)))
      return;

    if (!imported) {
      const last = node.properties[node.properties.length - 1];
      if (!last) return;
      edits.push({
        position: last.getEnd(),
        text: `, imports: [${needed.join(', ')}]`,
      });
      return;
    }

    const present = imported.elements.map((element) => element.getText());
    const missing = needed.filter((name) => !present.includes(name));
    if (!missing.length) return;

    const last = imported.elements[imported.elements.length - 1];
    edits.push(
      last
        ? { position: last.getEnd(), text: `, ${missing.join(', ')}` }
        : { position: imported.getStart() + 1, text: missing.join(', ') },
    );
  };

  forEachChild(file, visit);

  return edits
    .sort((a, b) => b.position - a.position)
    .reduce(
      (acc, edit) =>
        acc.slice(0, edit.position) + edit.text + acc.slice(edit.position),
      content,
    );
}

export interface MatcherDef {
  files: string;
  from: RegExp;
  to: string | ((match: string, ...args: string[]) => string);
}

export interface Matcher {
  matchers: MatcherDef[];
  step: string;
}

// TODO refactor migration to be AST based
export function generateMatchers(path: string) {
  const noSpecFiles = { ignore: `${path}spec.ts`, files: `${path}.ts` };

  const [directive, pipe, pipeInBinding] = [
    /(translate|\[translate(?:Params)?\])=("|')[^"']*\2/gm,
    new RegExp(PIPE_REGEX, 'gm'),
    new RegExp(PIPE_IN_BINDING_REGEX, 'gm'),
  ].map((regex) => ({
    files: `${path}.html`,
    from: regex,
    to: (match: string) => match.replace(/translate/g, 'transloco'),
  }));

  const moduleMultiImport = {
    files: `${path}.ts`,
    from: /import\s*{((([^,}]*,)+\s*(TranslateModule)\s*(,[^}]*)*)|(([^,{}]*,)*\s*(TranslateModule)\s*,\s*[a-zA-Z0-9]+(,[^}]*)*))\s*}\s*from\s*('|").?ngx-translate(\/[^'"]+)?('|");?/g,
    to: (match: string) =>
      match
        .replace('TranslateModule', '')
        .replace(/,\s*,/, ',')
        .replace(/{\s*,/, '{')
        .replace(/,\s*}/, '}')
        .concat(
          `\nimport { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';`,
        ),
  };

  const moduleSingleImport = {
    files: `${path}.ts`,
    from: /import\s*{\s*(TranslateModule),?\s*}\s*from\s*('|").?ngx-translate(\/[^'"]+)?('|");?/g,
    to: `import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';`,
  };

  const modules = {
    files: `${path}.ts`,
    from: /(?<![a-zA-Z])TranslateModule(?![^]*from)(\.(forRoot|forChild)\(({[^}]*})*[^)]*\))?/g,
    to: 'TranslocoDirective, TranslocoPipe',
  };

  // Runs last in the modules step, over whatever the replacements above left.
  const reExportedDeclarables = {
    files: `${path}.ts`,
    from: /^[^]+$/g,
    to: (match: string) => importReExportedDeclarables(match),
  };

  const serviceMultiImport = {
    files: `${path}.ts`,
    from: /import\s*{((([^,}]*,)+\s*(TranslateService)\s*(,[^}]*)*)|(([^,{}]*,)*\s*(TranslateService)\s*,\s*[a-zA-Z0-9]+(,[^}]*)*))\s*}\s*from\s*('|").?ngx-translate(\/[^'"]+)?('|");?/g,
    to: (match: string) =>
      match
        .replace('TranslateService', '')
        .replace(/,\s*,/, ',')
        .replace(/{\s*,/, '{')
        .replace(/,\s*}/, '}')
        .concat(`\nimport { TranslocoService } from '@jsverse/transloco';`),
  };

  const [serviceSingleImport, pipeImport] = [
    /import\s*{\s*(TranslateService),?\s*}\s*from\s*('|").?ngx-translate(\/[^'"]+)?('|");?/g,
    /import\s*{\s*(TranslatePipe),?\s*}\s*from\s*('|")[^'"]+('|");?/g,
  ].map((regex) => ({
    ...noSpecFiles,
    from: regex,
    to: `import { TranslocoService } from '@jsverse/transloco';`,
  }));

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
    files: `${path}spec.ts`,
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
      matchers: [
        modules,
        moduleMultiImport,
        moduleSingleImport,
        reExportedDeclarables,
      ],
      step: 'modules',
    },
    {
      matchers: [serviceMultiImport, serviceSingleImport, pipeImport],
      step: 'service imports',
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
