const ora = require('ora');
const replace = require('replace-in-file');
const p = require('path');

// Example: `./src/ng2/**/*.html`;
export function run(path) {
  console.log('\x1b[4m%s\x1b[0m', 'Starting migration script');
  const dir = p.resolve(process.cwd());

  path = p.join(dir, path, '/**/*');

  const tsFiles = { ignore: `${path}spec.ts`, files: `${path}.ts` };
  const [directive, pipe, pipeInBinding] = [
    /(translate|\[translate(Params)?\])="[^"]*"/gm,
    /{{([^}\r\n]*|)\s*(translate)(:({[^}\r\n]+}))*\s*}}/gm,
    /="([^}\r\n]*|)\s*(translate)(:({[^}\r\n]+}))*\s*"/gm
  ].map(regex => ({
    files: `${path}.html`,
    from: regex,
    to: match => match.replace('translate', 'transloco')
  }));

  const moduleMultiImport = {
    ...tsFiles,
    from: /import\s*{((([^,}]*,)+\s*(TranslateModule)\s*(,[^}]*)*)|(([^,{}]*,)*\s*(TranslateModule)\s*,\s*[a-zA-Z0-9]+(,[^}]*)*))\s*}\s*from\s*('|").?ngx-translate(\/[^'"]+)?('|");?/g,
    to: match =>
      match
        .replace('TranslateModule', '')
        .replace(/,\s*,/, ',')
        .replace(/{\s*,/, '{')
        .replace(/,\s*}/, '}')
        .concat(`\nimport { TranslocoModule } from '@ngneat/transloco';`)
  };

  const moduleSingleImport = {
    ...tsFiles,
    from: /import\s*{\s*(TranslateModule),?\s*}\s*from\s*('|").?ngx-translate(\/[^'"]+)?('|");?/g,
    to: `import { TranslocoModule } from '@ngneat/transloco';`
  };

  const modules = {
    ...tsFiles,
    from: /TranslateModule(?![^]*from)(\.(forRoot|forChild)\(({[^}]*})*[^)]*\))?/g,
    to: 'TranslocoModule'
  };

  const serviceMultiImport = {
    ...tsFiles,
    from: /import\s*{((([^,}]*,)+\s*(TranslateService)\s*(,[^}]*)*)|(([^,{}]*,)*\s*(TranslateService)\s*,\s*[a-zA-Z0-9]+(,[^}]*)*))\s*}\s*from\s*('|").?ngx-translate(\/[^'"]+)?('|");?/g,
    to: match =>
      match
        .replace('TranslateService', '')
        .replace(/,\s*,/, ',')
        .replace(/{\s*,/, '{')
        .replace(/,\s*}/, '}')
        .concat(`\nimport { TranslocoService } from '@ngneat/transloco';`)
  };

  const [serviceSingleImport, pipeImport] = [
    /import\s*{\s*(TranslateService),?\s*}\s*from\s*('|").?ngx-translate(\/[^'"]+)?('|");?/g,
    /import\s*{\s*(TranslatePipe),?\s*}\s*from\s*('|")[^'"]+('|");?/g
  ].map(regex => ({
    ...tsFiles,
    from: regex,
    to: `import { TranslocoService } from '@ngneat/transloco';`
  }));

  const constructorInjection = {
    ...tsFiles,
    from: /(?:private|protected|public)\s+(.*?)\s*:\s*(?:TranslateService|TranslatePipe\s*(?:,|\)))/g,
    to: match => match.replace(/TranslateService|TranslatePipe/g, 'TranslocoService')
  };

  const instantTranslation = {
    ...tsFiles,
    from: /[^]*(?=(?:private|protected|public)\s+([^,:()]+)\s*:\s*(?:TranslocoService\s*(?:,|\))))[^]*/gm,
    to: match => {
      const serviceName = /(?:private|protected|public)\s+([^,:()]+)\s*:\s*(?:TranslocoService\s*(?:,|\)))/gm.exec(
        match
      )[1];
      const sanitizedName = serviceName
        .split('')
        .map(char => (['$', '^'].includes(char) ? `\\${char}` : char))
        .join('');
      return match.replace(new RegExp(`(?:(?:=\\s*|this\\.)${sanitizedName})\\.(instant|transform)`, 'g'), str =>
        str.replace(/instant|transform/, 'translate')
      );
    }
  };

  const htmlReplacements = [
    {
      matchers: [directive],
      step: 'directives'
    },
    {
      matchers: [pipe, pipeInBinding],
      step: 'pipes'
    }
  ];
  const tsReplacements = [
    {
      matchers: [moduleMultiImport, moduleSingleImport, serviceMultiImport, serviceSingleImport, pipeImport],
      step: 'imports'
    },
    {
      matchers: [modules],
      step: 'modules'
    },
    {
      matchers: [constructorInjection],
      step: 'constructor injections'
    },
    {
      matchers: [instantTranslation],
      step: 'instant translations'
    }
  ];

  async function migrate(matchersArr, filesType) {
    console.log(`\nMigrating ${filesType} files`);
    let spinner;
    for (let i = 0; i < matchersArr.length; i++) {
      let { step, matchers } = matchersArr[i];
      const msg = `Step ${i + 1}/${matchersArr.length}: Migrating ${step}`;
      spinner = ora().start(msg);
      for (let matcher of matchers) {
        await replace(matcher);
      }
      spinner.succeed(msg);
    }
  }

  return migrate(htmlReplacements, 'HTML')
    .then(() => migrate(tsReplacements, 'TS'))
    .then(() => {
      console.log('\n              🌵 Done! 🌵');
      console.log('Welcome to a better translation experience 🌐');
      console.log(
        '\nFor more information about this script please visit 👉 https://github.com/ngneat/transloco/tree/v1/migration/migration.md'
      );
    });
}
