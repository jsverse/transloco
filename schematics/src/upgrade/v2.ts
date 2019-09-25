const glob = require('glob');
const p = require('path');
const fs = require('fs');

export function run(path) {
  console.log('\x1b[4m%s\x1b[0m', '⬆️ Starting v2 upgrade script ⬆️');
  const dir = p.resolve(process.cwd());
  path = p.join(dir, path, '/**/*');
  const htmlFiles = glob.sync(`${path}.html`);
  const structuralRegex = /<([a-zA-Z-]*)[^*>]*\*transloco=('|")\s*let\s+(?<varName>\w*)[^>]*\2>[^]+?<\/\1\s*>/g;
  const templateKey = varName => new RegExp(`${varName}(?:(?:\\[(?:'|"))|\\.)([^}|:]*)`, 'g');
  for (const file of htmlFiles) {
    let str = fs.readFileSync(file).toString('utf8');
    if (!str.includes('*transloco')) continue;
    let result = structuralRegex.exec(str);
    while (result) {
      const [matchedStr] = result;
      let { varName } = result.groups;
      let scopeKeys = matchedStr.match(templateKey(varName));
      scopeKeys &&
        scopeKeys.forEach(rawKey => {
          /** The raw key may contain square braces we need to align it to '.' */
          let [key, ...inner] = rawKey
            .trim()
            .replace(/\[/g, '.')
            .replace(/'|"|\]|\?/g, '')
            .replace(`${varName}.`, '')
            .split('.');
          if (inner.length) {
            str = str.replace(rawKey, `${varName}['${key}.${inner.join('.')}']`);
          }
        });
      result = structuralRegex.exec(str);
    }
    fs.writeFileSync(file, str, { encoding: 'utf8' });
  }
  const modules = glob.sync(`${path}.module.ts`);
  for (const file of modules) {
    let str = fs.readFileSync(file).toString('utf8');
    if (!str.includes('@ngneat/transloco')) continue;
    /** change listenToLangChange to renderOnce */
    str = str.replace('listenToLangChange', 'renderLangOnce');
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
