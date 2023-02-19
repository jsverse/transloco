import * as kebabCase from 'lodash.kebabcase';
import { sync as globSync } from 'glob';
import * as fs from 'fs-extra';

const regex =
  /<([\w-]*)\s*(?=[^>]*i18n)[^>]*i18n(?:(?:=("|')(?<attrValue>[^>]*?)\2)|(?:-(?<propName>[\w-]*)[^>]*\4=("|')(?<propValue>[^>]*?)\5))?[^>]*(?:>(?<innerText>[^]*?)<\/\1)?/g;

export function run({ input, output, langs }) {
  const files = globSync(`${process.cwd()}/${input}/**/*.html`);
  let translation = {};
  for (const filePath of files) {
    const tpl = fs.readFileSync(filePath, { encoding: 'utf-8' });
    translation = { ...translation, ...getTranslation(tpl) };

    const newTpl = getNewTemplate(tpl);
    fs.outputFileSync(filePath, newTpl);
  }

  for (const lang of langs) {
    const sorted = Object.keys(translation)
      .sort()
      .reduce((acc, key) => {
        acc[key] = translation[key];
        return acc;
      }, {});
    fs.outputJsonSync(`${process.cwd()}/${output}/${lang}.json`, sorted, {
      spaces: 2,
    });
  }

  console.log('\n              🌵 Done! 🌵');
  console.log('Welcome to a better translation experience 🌐');
  console.log(
    '\nFor more information about this script please visit 👉 https://ngneat.github.io/transloco/docs/migration/angular\n'
  );
}

function resolveKey(attrValue, value) {
  let key = value;
  if (!attrValue) {
    return kebabCase(value);
  }

  if (attrValue) {
    const splitCustomId = attrValue.split('@@');
    const hasCustomId = splitCustomId.length === 2;
    key = hasCustomId ? splitCustomId[1] : key;
  }

  key = kebabCase(key);
  return key;
}

function getTranslation(template) {
  let result = regex.exec(template);
  const translation = {};

  while (result) {
    const { attrValue, innerText, propValue } = result.groups;
    let context;
    let comment;
    let keyValue = propValue ? propValue : innerText;
    let key = keyValue;

    if (attrValue) {
      const splitCustomId = attrValue.split('@@');
      const hasCustomId = splitCustomId.length === 2;
      key = hasCustomId ? splitCustomId[1] : key;

      const splitContextDescription = attrValue.split('|');
      // we have context
      if (splitContextDescription.length === 2) {
        context = splitContextDescription[0];
        comment = splitContextDescription[1].split('@@')[0];
      } else {
        if (splitContextDescription[0].startsWith('@@') === false) {
          comment = attrValue.split('@@')[0];
        }
      }
    }

    key = kebabCase(key);
    keyValue = keyValue.trim().replace(/(\r\n|\n|\r)/gm, '');

    if (context) {
      translation[context] = translation[context] || {};
      translation[context][key] = keyValue;
      if (comment) {
        translation[context][`${key}.comment`] = comment;
      }
    } else {
      translation[key] = keyValue;
      if (comment) {
        translation[`${key}.comment`] = comment;
      }
    }

    result = regex.exec(template);
  }

  return translation;
}

function getNewTemplate(template) {
  return template.replace(
    regex,
    function (
      match,
      tag,
      mark,
      attrValue,
      propName,
      propMark,
      propValue,
      innerText
    ) {
      let replace = ' i18n';
      const key = resolveKey(attrValue, propValue || innerText);
      let value = innerText;
      const newValue = `{{ '${key}' | transloco }}`;

      if (attrValue) {
        replace = ` i18n=${mark}${attrValue}${mark}`;
      }

      if (propName) {
        replace = ` i18n-${propName}`;
        value = propValue;
      }

      return match.replace(replace, '').replace(value, newValue);
    }
  );
}
