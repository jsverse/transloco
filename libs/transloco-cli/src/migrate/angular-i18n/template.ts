import { dasherize } from './dasherize.js';

const regex =
  /<([\w-]*)\s*(?=[^>]*i18n)[^>]*i18n(?:(?:=("|')(?<attrValue>[^>]*?)\2)|(?:-(?<propName>[\w-]*)[^>]*\4=("|')(?<propValue>[^>]*?)\5))?[^>]*(?:>(?<innerText>[^]*?)<\/\1)?/g;

export type Translation = Record<string, unknown>;

/**
 * Takes the Angular i18n marks out of a template: the template with the
 * marked text replaced by `transloco` pipes, and the translations they held.
 */
export function migrateTemplate(template: string) {
  const translation = getTranslation(template);

  return { template: getNewTemplate(template), translation };
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

function getTranslation(template: string): Translation {
  // A key that can't be made throws halfway through the matches, which leaves
  // the position where it stopped for the next template.
  regex.lastIndex = 0;

  let result = regex.exec(template);
  const translation: Translation = {};

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
      const contextTranslation = (translation[context] ?? {}) as Translation;
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
