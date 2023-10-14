import { Route } from '@angular/router';

import { provideTranslocoScopes, Translation } from '@ngneat/transloco';

const loader = ['en', 'es'].reduce((acc, lang: string) => {
  acc[lang] = () => import(`./i18n/${lang}.json`);
  return acc;
}, {} as Record<string, () => Promise<Translation>>);

export const INLINE_LOADERS_ROUTES: Route = {
  path: 'inline-loaders',
  loadComponent: () =>
    import('./inline-loaders.component').then(
      (InlineLoadersComponent) => InlineLoadersComponent
    ),
  providers: [
    provideTranslocoScopes({
      scope: 'inline',
      loader,
    }),
  ],
};
