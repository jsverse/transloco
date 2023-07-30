import { Route } from '@angular/router';

import { provideTranslocoScope, Translation } from '@ngneat/transloco';

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
    provideTranslocoScope({
      scope: 'inline',
      loader,
    }),
  ],
};
