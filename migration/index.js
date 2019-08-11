const replace = require('replace-in-file');

// Example: `./src/ng2/**/*.html`;
const path = '**/*';

const replacements = [
  {
    files: `${path}.html`,
    from: /(translate|\[translate(Params)?\])="[^"]*"/g,
    to: match => match.replace('translate', 'transloco')
  },
  {
    files: `${path}.html`,
    from: /{{([^}\r\n]*|)\s*(translate)(:({[^}\r\n]+}))*\s*}}/gm,
    to: match => match.replace('translate', 'transloco')
  },
  {
    files: `${path}.ts`,
    from: /import\s*{\s*(TranslateService)\s*}\s*from\s*('|")ngx-translate('|");?/g,
    to: match => {
      return match.replace('TranslateService', 'TranslocoService').replace('ngx-translate', '@ngneat/transloco');
    }
  },
  {
    files: `${path}.ts`,
    from: /(?:private|protected|public)\s+(.*?)\s*:\s*(?:TranslateService\s*(?:,|\)))/g,
    to: match => match.replace('TranslateService', 'TranslocoService')
  },
  {
    files: `${path}.ts`,
    from: /(?:private|protected|public)\s+(.*?)\s*:\s*TranslateService(?:[^]*((?:(?:=\s*|this\.)\1)\.instant))+/gm,
    to: match => match.replace('instant', 'translate')
  }
];

Promise.all(replacements.map(r => replace(r)))
  .then(() => console.log('done!!'))
  .catch(error => console.error('Error occurred:', error));
