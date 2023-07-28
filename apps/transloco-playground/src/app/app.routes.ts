import { Routes } from '@angular/router';
import { DYNAMIC_TRANSLATION_ROUTES } from './dynamic-translation/dynamic-translation.routes';
import { INLINE_LOADERS_ROUTES } from './inline-loaders/inline-loaders.routes';
import { LAZY_MULTIPLE_SCOPES_ROUTES } from './lazy-multiple-scopes/lazy-multiple-scopes.routes';
import { LAZY_SCOPE_ALIAS_ROUTES } from './lazy-scope-alias/lazy-scope-alias.routes';
import { LAZY_ROUTES } from './lazy/lazy.routes';
import { OnPushComponent } from './on-push/on-push.component';
import { SCOPE_SHARING_ROUTES } from './scope-sharing/scope-sharing.routes';
import { TRANSPILERS_ROUTES } from './transpilers/transpilers.routes';
import { MULTI_LANGS_ROUTES } from './multi-langs/multi-langs.routes';
import { LOCALE_ROUTES } from './locale/locale.routes';

export const ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: OnPushComponent,
  },
  LAZY_ROUTES,
  TRANSPILERS_ROUTES,
  DYNAMIC_TRANSLATION_ROUTES,
  INLINE_LOADERS_ROUTES,
  LAZY_SCOPE_ALIAS_ROUTES,
  LAZY_MULTIPLE_SCOPES_ROUTES,
  SCOPE_SHARING_ROUTES,
  MULTI_LANGS_ROUTES,
  LOCALE_ROUTES,
];
