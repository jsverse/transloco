const glob = require('glob');
const p = require('path');
const fs = require('fs');

export function run(path) {
  console.log('\x1b[4m%s\x1b[0m', '⬆️ Starting v2 upgrade script ⬆️');
  const dir = p.resolve(process.cwd());
  path = p.join(dir, path, '/**/*');
  const htmlFiles = glob.sync(`${path}.html`);
  const templateRegex = /<ng-template[^>]*transloco[^>]*>[^]+?<\/ng-template>/g;
  const structuralRegex = /<([a-zA-Z-]*)[^*>]*\*transloco=('|")\s*let\s+(?<varName>\w*)[^>]*\2>[^]+?<\/\1\s*>/g;
  const coreKeyRegex = varName =>
    `(?<rawKey>${varName}(?:(?:\\[('|").+\\1\\])|(?:\\.\\w+))+)(?<param>[\\s\\w|:{}'"$&!?%@#^)(]*)`;
  const bindingKey = varName => new RegExp(`("|')\\s*${coreKeyRegex(varName)}\\1`, 'g');
  const templateKey = varName => new RegExp(`{{\\s*${coreKeyRegex(varName)}}}`, 'g');
  for (const file of htmlFiles) {
    let str = fs.readFileSync(file).toString('utf8');
    if (!str.includes('transloco')) continue;
    [structuralRegex, templateRegex].forEach((rgx, index) => {
      let containerSearch = rgx.exec(str);
      while (containerSearch) {
        const [matchedStr] = containerSearch;
        const { varName } = index === 0 ? containerSearch.groups : matchedStr.match(/let-(?<varName>\w*)/).groups;
        let newStructuralStr = matchedStr;
        let hasMatches;
        [templateKey(varName), bindingKey(varName)].forEach(keyRegex => {
          let keySearch = keyRegex.exec(matchedStr);
          hasMatches = hasMatches || !!keySearch;
          while (keySearch) {
            const { rawKey, param } = keySearch.groups;
            /** The raw key may contain square braces we need to align it to '.' */
            let [key, ...inner] = rawKey
              .trim()
              .replace(/\[/g, '.')
              .replace(/'|"|\]|\?/g, '')
              .replace(`${varName}.`, '')
              .split('.');
            let callEnd = ')';
            const pipes = (param && param.split('|')) || [];
            const [paramsPipe] = pipes.filter(pipe => pipe.includes('translocoParams'));
            if (paramsPipe) {
              const paramValue = paramsPipe.substring(paramsPipe.indexOf('{'), paramsPipe.lastIndexOf('}') + 1);
              if (paramValue) {
                callEnd = `, ${paramValue})`;
              }
            }
            if (inner.length) {
              key = `${key}.${inner.join('.')}`;
            }
            newStructuralStr = paramsPipe
              ? newStructuralStr.replace(
                  `${rawKey}${param}`,
                  `${varName}('${key}'${callEnd} ${pipes.filter(pipe => !pipe.includes('translocoParams')).join('|')}`
                )
              : newStructuralStr.replace(rawKey, `${varName}('${key}'${callEnd}`);
            keySearch = keyRegex.exec(matchedStr);
          }
        });
        if (hasMatches) {
          str = str.replace(matchedStr, newStructuralStr);
        }
        containerSearch = rgx.exec(str);
      }
    });
    fs.writeFileSync(file, str, { encoding: 'utf8' });
  }
  const modules = glob.sync(`${path}.module.ts`);
  for (const file of modules) {
    let str = fs.readFileSync(file).toString('utf8');
    if (!str.includes('@ngneat/transloco')) continue;
    /** change listenToLangChange to renderOnce */
    str = str.replace('listenToLangChange', 'reRenderOnLangChange');
    /** Remove scopeStrategy */
    str = str.replace(/\s*scopeStrategy:.*?,/, '');
    /** Add availableLangs */
    if (!str.includes('availableLangs')) {
      str = str.replace(/((\s*)defaultLang:(.*?),)/, (str, g1, g2, g3) => `${g1}${g2}availableLangs: [${g3.trim()}],`);
    }
    fs.writeFileSync(file, str, { encoding: 'utf8' });
  }
  console.log(`Done! Welcome to Transloco v2 😎`);
}
