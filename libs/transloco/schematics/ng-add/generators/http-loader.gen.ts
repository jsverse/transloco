import { apply, move, template, url } from '@angular-devkit/schematics';

export interface CreateLoaderFileParams {
  ssr: boolean;
  loaderPath: string;
  urlPath: string;
}

export function createLoaderFile({
  ssr,
  loaderPath,
  urlPath,
}: CreateLoaderFileParams) {
  return apply(url(`./files/transloco-loader`), [
    template({
      // Replace the __ts__ with ts
      ts: 'ts',
      loaderPrefix: ssr ? '${environment.baseUrl}' : '',
      urlPath: urlPath,
    }),
    move('/', loaderPath),
  ]);
}
