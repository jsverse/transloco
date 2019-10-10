import { from } from 'rxjs';
import { map } from 'rxjs/operators';

export function getFallbacksLoaders(loader, mainPath: string, fallbackPath: string) {
  return [mainPath, fallbackPath].map(path => {
    return from(loader.getTranslation(path)).pipe(
      map(translation => ({
        translation,
        lang: path
      }))
    );
  });
}
