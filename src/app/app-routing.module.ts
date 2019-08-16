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
    loadChildren: './lazy/lazy.module#LazyModule'
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
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
