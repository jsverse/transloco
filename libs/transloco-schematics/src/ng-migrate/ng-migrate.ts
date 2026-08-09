import { sync as globSync } from 'glob';
import { readFileSync, outputFileSync, outputJsonSync } from 'fs-extra';
import { dasherize } from '@angular-devkit/core/src/utils/strings';

const regex =
  /<([\w-]*)\s*(?=[^>]*i18n)[^>]*i18n(?:(?:=("|')(?<attrValue>[^>]*?)\2)|(?:-(?<propName>[\w-]*)[^>]*\4=("|')(?<propValue>[^>]*?)\5))?[^>]*(?:>(?<innerText>[^]*?)<\/\1)?/g;

interface RunOptions {
  input: string;
  output: string;
  langs: string[];
}

export function run({ input, output, langs }: RunOptions) {
  const files = globSync(`${process.cwd()}/${input}/**/*.html`);
  let translation: Record<string, unknown> = {};
  for (const filePath of files) {
    const tpl = readFileSync(filePath, { encoding: 'utf-8' });
    translation = { ...translation, ...getTranslation(tpl) };

    const newTpl = getNewTemplate(tpl);
    outputFileSync(filePath, newTpl);
  }

  for (const lang of langs) {
    const sorted = Object.keys(translation)
      .sort()
      .reduce((acc: Record<string, unknown>, key) => {
        acc[key] = translation[key];
        return acc;
      }, {});
    outputJsonSync(`${process.cwd()}/${output}/${lang}.json`, sorted, {
      spaces: 2,
    });
  }

  console.log('\n              🌵 Done! 🌵');
  console.log('Welcome to a better translation experience 🌐');
  console.log(
    '\nFor more information about this script please visit 👉 https://jsverse.github.io/transloco/docs/migration/angular\n',
  );
}

function resolveKey(attrValue: string | undefined, value: string): string {
  let key = value;
  if (!attrValue) {
    return dasherize(value);
  }

  if (attrValue) {
    const splitCustomId = attrValue.split('@@');
    const hasCustomId = splitCustomId.length === 2;
    key = hasCustomId ? splitCustomId[1] : key;
  }

  key = dasherize(key);
  return key;
}

function getTranslation(template: string): Record<string, unknown> {
  let result = regex.exec(template);
  const translation: Record<string, unknown> = {};

  while (result) {
    const { attrValue, innerText, propValue } = result.groups ?? {};
    let context: string | undefined;
    let comment: string | undefined;
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

    key = dasherize(key);
    keyValue = keyValue.trim().replace(/(\r\n|\n|\r)/gm, '');

    if (context) {
      const contextTranslation = (translation[context] ?? {}) as Record<
        string,
        unknown
      >;
      translation[context] = contextTranslation;
      contextTranslation[key] = keyValue;
      if (comment) {
        contextTranslation[`${key}.comment`] = comment;
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

function getNewTemplate(template: string): string {
  return template.replace(
    regex,
    function (
      match: string,
      tag: string,
      mark: string,
      attrValue: string,
      propName: string,
      propMark: string,
      propValue: string,
      innerText: string,
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
    },
  );
}
