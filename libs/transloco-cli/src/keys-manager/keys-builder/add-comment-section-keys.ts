import { getConfig } from '../config';
import { BaseParams } from '../types';
import { regexFactoryMap } from '../utils/regexs.utils';

import { addKey } from './add-key';
import { resolveAliasAndKey } from './utils/resolvers.utils';

interface ExtractCommentsParams extends BaseParams {
  content: string;
  regexFactory(): RegExp;
  read?: string;
}

function stringToKeys(valueRegex: RegExp) {
  return function (str: string) {
    // Remove the wrapper, t(some.key) => some.key
    return (
      str
        .replace(valueRegex, '$1')
        // Support multi keys t(a, b.c, d)
        .split(',')
        // Remove spaces
        .map((v) => v.replace(/[*\n]/g, '').trim())
        // Remove empty keys
        .filter((key) => key.length > 0)
    );
  };
}

function flatten(acc: string[], strings: string[]) {
  acc.push(...strings);

  return acc;
}

export function addCommentSectionKeys({
  content,
  regexFactory,
  read = '',
  ...baseParams
}: ExtractCommentsParams) {
  const marker = getConfig().marker;
  const regex = regexFactory();
  let commentsSection = regex.exec(content);

  while (commentsSection) {
    const valueRegex = regexFactoryMap.markerValues(marker);
    // Get the rawKeys from the dynamic section
    const markers = commentsSection[0].match(valueRegex);

    commentsSection = regex.exec(content);

    if (!markers) continue;

    markers
      .map(stringToKeys(valueRegex))
      .reduce(flatten, [])
      .forEach((currentKey) => {
        const withRead = read ? `${read}.${currentKey}` : currentKey;

        const [resolvedKey, scopeAlias] = resolveAliasAndKey(
          withRead,
          baseParams.scopes,
        );

        // It means this is a global key when there's no scope alias
        const translationKey = scopeAlias ? resolvedKey : withRead;

        addKey({
          ...baseParams,
          keyWithoutScope: translationKey,
          scopeAlias,
        });
      });
  }
}
