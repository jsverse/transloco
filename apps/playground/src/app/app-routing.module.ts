import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'lazy',
    loadChildren: () => import('./lazy/lazy.module').then(({ LazyModule }) => LazyModule)
  },
  {
    path: 'lazy-scope-alias',
    loadChildren: () =>
      import('./lazy-scope-alias/lazy-scope-alias.module').then(({ LazyScopeAliasModule }) => LazyScopeAliasModule)
  },
  {
    path: 'lazy-multiple-scopes',
    loadChildren: () =>
      import('./lazy-multiple-scopes/lazy-multiple-scopes.module').then(
        ({ LazyMultipleScopesModule }) => LazyMultipleScopesModule
      )
  },
  {
    path: 'scope-sharing',
    loadChildren: () =>
      import('./scope-sharing/scope-sharing.module').then(({ ScopeSharingModule }) => ScopeSharingModule)
  },
  {
    path: 'inline-loaders',
    loadChildren: () =>
      import('./inline-loaders/inline-loaders.module').then(({ InlineLoadersModule }) => InlineLoadersModule)
  },
  {
    path: 'dynamic-translation',
    loadChildren: () =>
      import('./dynamic-translation/dynamic-translation.module').then(
        ({ DynamicTranslationModule }) => DynamicTranslationModule
      )
  },
  {
    path: 'multilangs',
    loadChildren: () => import('./multilangs/multilangs.module').then(({ MultilangsModule }) => MultilangsModule)
  },
  {
    path: 'transpilers',
    loadChildren: () => import('./transpilers/transpilers.module').then(({ TranspilersModule }) => TranspilersModule)
  },
  {
    path: 'locale',
    loadChildren: () => import('./locale/locale.module').then(({ LocaleModule }) => LocaleModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
