import { from, map } from 'rxjs';

import { resolveLoader } from './resolve-loader';
import { TranslocoLoader, TranslocoLoaderData } from './transloco.loader';
import { InlineLoader } from './transloco.types';

interface Options {
  path: string;
  fallbackPath?: string;
  inlineLoader?: InlineLoader;
  mainLoader: TranslocoLoader;
  data?: TranslocoLoaderData;
}

export function getFallbacksLoaders({
  mainLoader,
  path,
  data,
  fallbackPath,
  inlineLoader,
}: Options) {
  const paths = fallbackPath ? [path, fallbackPath] : [path];

  return paths.map((path) => {
    const loader = resolveLoader({ path, mainLoader, inlineLoader, data });

    return from(loader).pipe(
      map((translation) => ({
        translation,
        lang: path,
      })),
    );
  });
}
