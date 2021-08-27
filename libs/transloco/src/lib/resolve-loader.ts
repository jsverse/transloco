import { TranslocoLoader, TranslocoLoaderData } from './transloco.loader';
import { InlineLoader } from './types';
import { isFunction } from './helpers';

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
      res.default ? res.default : res
    );
  }

  return mainLoader.getTranslation(path, data);
}
