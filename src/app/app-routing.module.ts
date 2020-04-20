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
    loadChildren: './lazy/lazy.module#LazyModule'
  },
  {
    path: 'lazy-scope-alias',
    loadChildren: './lazy-scope-alias/lazy-scope-alias.module#LazyScopeAliasModule'
  },
  {
    path: 'lazy-multiple-scopes',
    loadChildren: './lazy-multiple-scopes/lazy-multiple-scopes.module#LazyMultipleScopesModule'
  },
  {
    path: 'scope-sharing',
    loadChildren: './scope-sharing/scope-sharing.module#ScopeSharingModule'
  },
  {
    path: 'inline-loaders',
    loadChildren: './inline-loaders/inline-loaders.module#InlineLoadersModule'
  },
  {
    path: 'dynamic-translation',
    loadChildren: './dynamic-translation/dynamic-translation.module#DynamicTranslationModule'
  },
  {
    path: 'multilangs',
    loadChildren: './multilangs/multilangs.module#MultilangsModule'
  },
  {
    path: 'transpilers',
    loadChildren: './transpilers/transpilers.module#TranspilersModule'
  },
  {
    path: 'locale',
    loadChildren: './locale/locale.module#LocaleModule'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
