import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { resolveLoader } from './resolve-loader';
import { TranslocoLoader } from './transloco.loader';
import { InlineLoader } from './types';

export function getFallbacksLoaders(
  mainPath: string,
  fallbackPath: string,
  mainLoader: TranslocoLoader,
  inlineLoader: InlineLoader
) {
  return [mainPath, fallbackPath].map(path => {
    const loader = resolveLoader(path, mainLoader, inlineLoader);

    return from(loader).pipe(
      map(translation => ({
        translation,
        lang: path
      }))
    );
  });
}
