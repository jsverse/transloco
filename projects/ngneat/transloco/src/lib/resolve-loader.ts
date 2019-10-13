import { TranslocoLoader } from './transloco.loader';
import { InlineLoader } from './types';
import { isFunction } from './helpers';

export function resolveLoader(path: string, mainLoader: TranslocoLoader, inlineLoader: InlineLoader) {
  if (inlineLoader) {
    const pathLoader = inlineLoader[path];
    if (isFunction(pathLoader) === false) {
      throw `You're using an inline loader but didn't provide a loader for ${path}`;
    }

    return inlineLoader[path]().then(res => res.default);
  }

  return mainLoader.getTranslation(path);
}
