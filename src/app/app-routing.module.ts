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
    path: 'scope-sharing',
    loadChildren: './scope-sharing/scope-sharing.module#ScopeSharingModule'
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
