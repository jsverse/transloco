import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {LazyMultipleScopesComponent} from './lazy-multiple-scopes.component';
import {TRANSLOCO_LOADING_TEMPLATE, TranslocoModule} from '@ngneat/transloco';

const routes: Routes = [
  {
    path: '',
    component: LazyMultipleScopesComponent
  }
];


@NgModule({
  declarations: [LazyMultipleScopesComponent],
  providers: [
    {
      provide: TRANSLOCO_LOADING_TEMPLATE,
      useValue: `<span id="default-loading-template">Loading template...</span>`
    }
  ],
  imports: [CommonModule, RouterModule.forChild(routes), TranslocoModule]
})
export class LazyMultipleScopesModule { }
