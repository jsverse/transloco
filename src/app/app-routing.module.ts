import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full'
  },
  {
    path: 'lazy',
    loadChildren: () => import('./lazy/lazy.module').then(m => m.LazyModule)
  },
  {
    path: 'dynamic-translation',
    loadChildren: () => import('./dynamic-translation/dynamic-translation.module').then(m => m.DynamicTranslationModule)
  },
  {
    path: 'multilangs',
    loadChildren: () => import('./multilangs/multilangs.module').then(m => m.MultilangsModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
