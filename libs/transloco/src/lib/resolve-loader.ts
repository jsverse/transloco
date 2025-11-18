import { isFunction } from '@jsverse/utils';

import { TranslocoLoader, TranslocoLoaderData } from './transloco.loader';
import { InlineLoader } from './transloco.types';

interface Options {
  inlineLoader?: InlineLoader;
  path: string;
  mainLoader: TranslocoLoader;
  data?: TranslocoLoaderData;
}

export function resolveLoader(options: Options) {
  const { path, inlineLoader, mainLoader, data } = options;

  if (inlineLoader) {
    const pathLoader = inlineLoader[path];
    if (isFunction(pathLoader) === false) {
      throw `You're using an inline loader but didn't provide a loader for ${path}`;
    }

    return inlineLoader[path]().then((res) =>
      res.default ? res.default : res,
    );
  }

  return mainLoader.getTranslation(path, data);
}
