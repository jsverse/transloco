import { apply, move, template, url } from '@angular-devkit/schematics';

export interface CreateLoaderFileParams {
  loaderPath: string;
  urlPath: string;
}

export function createLoaderFile({
  loaderPath,
  urlPath,
}: CreateLoaderFileParams) {
  return apply(url(`./files/transloco-loader`), [
    template({
      // Replace the __ts__ with ts
      ts: 'ts',
      urlPath: urlPath,
    }),
    move('/', loaderPath),
  ]);
}
