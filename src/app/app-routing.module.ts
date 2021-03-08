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
    loadChildren: () => import('./lazy/lazy.module').then(m => m.LazyModule)
  },
  {
    path: 'lazy-scope-alias',
    loadChildren: () => import('./lazy-scope-alias/lazy-scope-alias.module').then(m => m.LazyScopeAliasModule)
  },
  {
    path: 'lazy-multiple-scopes',
    loadChildren: () =>
      import('./lazy-multiple-scopes/lazy-multiple-scopes.module').then(m => m.LazyMultipleScopesModule)
  },
  {
    path: 'scope-sharing',
    loadChildren: () => import('./scope-sharing/scope-sharing.module').then(m => m.ScopeSharingModule)
  },
  {
    path: 'inline-loaders',
    loadChildren: () => import('./inline-loaders/inline-loaders.module').then(m => m.InlineLoadersModule)
  },
  {
    path: 'dynamic-translation',
    loadChildren: () => import('./dynamic-translation/dynamic-translation.module').then(m => m.DynamicTranslationModule)
  },
  {
    path: 'multilangs',
    loadChildren: () => import('./multilangs/multilangs.module').then(m => m.MultilangsModule)
  },
  {
    path: 'transpilers',
    loadChildren: () => import('./transpilers/transpilers.module').then(m => m.TranspilersModule)
  },
  {
    path: 'locale',
    loadChildren: () => import('./locale/locale.module').then(m => m.LocaleModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
