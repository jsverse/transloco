import * as p from 'node:path';

import * as ora from 'ora';
import { replaceInFile } from 'replace-in-file';

const PIPE_CONTENT_REGEX = `\\s*([^}\\r\\n]*?\\|)\\s*(translate)[^\\r\\n]*`;
export const PIPE_REGEX = `{{${PIPE_CONTENT_REGEX}}}`;
export const PIPE_IN_BINDING_REGEX = `\\]=('|")${PIPE_CONTENT_REGEX}\\1`;

// Example: `./src/ng2/**/*.html`;
export function run(path) {
  console.log('\x1b[4m%s\x1b[0m', '\nStarting migration script');
  const dir = p.resolve(process.cwd());

  path = p.join(dir, path, '/**/*');

  const noSpecFiles = { ignore: `${path}spec.ts`, files: `${path}.ts` };
  const [directive, pipe, pipeInBinding] = [
    /(translate|\[translate(?:Params)?\])=("|')[^"']*\2/gm,
    new RegExp(PIPE_REGEX, 'gm'),
    new RegExp(PIPE_IN_BINDING_REGEX, 'gm'),
  ].map((regex) => ({
    files: `${path}.html`,
    from: regex,
    to: (match) => match.replace('translate', 'transloco'),
  }));

  const moduleMultiImport = {
    files: `${path}.ts`,
    from: /import\s*{((([^,}]*,)+\s*(TranslateModule)\s*(,[^}]*)*)|(([^,{}]*,)*\s*(TranslateModule)\s*,\s*[a-zA-Z0-9]+(,[^}]*)*))\s*}\s*from\s*('|").?ngx-translate(\/[^'"]+)?('|");?/g,
    to: (match) =>
      match
        .replace('TranslateModule', '')
        .replace(/,\s*,/, ',')
        .replace(/{\s*,/, '{')
        .replace(/,\s*}/, '}')
        .concat(`\nimport { TranslocoModule } from '@ngneat/transloco';`),
  };

  const moduleSingleImport = {
    files: `${path}.ts`,
    from: /import\s*{\s*(TranslateModule),?\s*}\s*from\s*('|").?ngx-translate(\/[^'"]+)?('|");?/g,
    to: `import { TranslocoModule } from '@ngneat/transloco';`,
  };

  const modules = {
    files: `${path}.ts`,
    from: /(?<![a-zA-Z])TranslateModule(?![^]*from)(\.(forRoot|forChild)\(({[^}]*})*[^)]*\))?/g,
    to: 'TranslocoModule',
  };

  const serviceMultiImport = {
    files: `${path}.ts`,
    from: /import\s*{((([^,}]*,)+\s*(TranslateService)\s*(,[^}]*)*)|(([^,{}]*,)*\s*(TranslateService)\s*,\s*[a-zA-Z0-9]+(,[^}]*)*))\s*}\s*from\s*('|").?ngx-translate(\/[^'"]+)?('|");?/g,
    to: (match) =>
      match
        .replace('TranslateService', '')
        .replace(/,\s*,/, ',')
        .replace(/{\s*,/, '{')
        .replace(/,\s*}/, '}')
        .concat(`\nimport { TranslocoService } from '@ngneat/transloco';`),
  };

  const [serviceSingleImport, pipeImport] = [
    /import\s*{\s*(TranslateService),?\s*}\s*from\s*('|").?ngx-translate(\/[^'"]+)?('|");?/g,
    /import\s*{\s*(TranslatePipe),?\s*}\s*from\s*('|")[^'"]+('|");?/g,
  ].map((regex) => ({
    ...noSpecFiles,
    from: regex,
    to: `import { TranslocoService } from '@ngneat/transloco';`,
  }));

  const constructorInjection = {
    ...noSpecFiles,
    from: /(?:private|protected|public)\s+(.*?)\s*:\s*(?:TranslateService|TranslatePipe\s*(?:,|\)))/g,
    to: (match) =>
      match.replace(/TranslateService|TranslatePipe/g, 'TranslocoService'),
  };

  const serviceUsage = {
    ...noSpecFiles,
    from: /(?=([^]+(?:private|protected|public)\s+([^,:()]+)\s*:\s*(?:TranslocoService\s*(?:,|\)))))\1[^]*/gm,
    to: (match, _, serviceName) => {
      const sanitizedName = serviceName
        .split('')
        .map((char) => (['$', '^'].includes(char) ? `\\${char}` : char))
        .join('');
      const functionsMap = {
        instant: 'translate',
        transform: 'translate',
        get: 'selectTranslate',
        stream: 'selectTranslate',
        use: 'setActiveLang',
        set: 'setTranslation',
      };
      const propsMap = {
        currentLang: 'getActiveLang()',
        onLangChange: 'langChanges$',
      };
      const serviceCallRgx = ({ map, func }) =>
        new RegExp(
          `(?:(?:\\s*|this\\.)${sanitizedName})(?:\\s*\\t*\\r*\\n*)*\\.(?:\\s*\\t*\\r*\\n*)*(${getTarget(
            map
          )})[\\r\\t\\n\\s]*${func ? '\\(' : '(?!\\()'}`,
          'g'
        );
      const getTarget = (t) => Object.keys(t).join('|');
      return [
        { func: true, map: functionsMap },
        { func: false, map: propsMap },
      ].reduce((acc, curr) => {
        return acc.replace(serviceCallRgx(curr), (str) =>
          str.replace(new RegExp(getTarget(curr.map)), (func) => curr.map[func])
        );
      }, match);
    },
  };

  const specs = {
    files: `${path}spec.ts`,
    from: /TranslateService|TranslatePipe/g,
    to: 'TranslocoService',
  };

  const htmlReplacements = [
    {
      matchers: [directive],
      step: 'directives',
    },
    {
      matchers: [pipe, pipeInBinding],
      step: 'pipes',
    },
  ];
  const tsReplacements = [
    {
      matchers: [modules, moduleMultiImport, moduleSingleImport],
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

  async function migrate(matchersArr, filesType) {
    console.log(`\nMigrating ${filesType} files 📜`);
    let spinner;
    for (let i = 0; i < matchersArr.length; i++) {
      const { step, matchers } = matchersArr[i];
      const msg = `Step ${i + 1}/${matchersArr.length}: Migrating ${step}`;
      spinner = ora().start(msg);
      const noFilesFound = [];
      for (const matcher of matchers) {
        try {
          await replaceInFile(matcher);
        } catch (e) {
          if (e.message.includes('No files match the pattern')) {
            noFilesFound.push(e.message);
          } else {
            throw e;
          }
        }
      }
      spinner.succeed(msg);
      noFilesFound.forEach((pattern) =>
        console.log('\x1b[33m%s\x1b[0m', `⚠️ ${pattern}`)
      );
    }
  }

  return migrate(htmlReplacements, 'HTML')
    .then(() => migrate(tsReplacements, 'TS'))
    .then(() => {
      console.log('\n              🌵 Done! 🌵');
      console.log('Welcome to a better translation experience 🌐');
      console.log(
        '\nFor more information about this script please visit 👉 https://ngneat.github.io/transloco/docs/migration/ngx\n'
      );
    });
}
