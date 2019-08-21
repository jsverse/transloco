import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MergedScopeComponent } from './merged-scope.component';
import { RouterModule, Routes } from '@angular/router';
import { TRANSLOCO_LOADING_TEMPLATE, TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

const routes: Routes = [
  {
    path: '',
    component: MergedScopeComponent
  }
];

@NgModule({
  declarations: [MergedScopeComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'todos-page' },
    {
      provide: TRANSLOCO_LOADING_TEMPLATE,
      useValue: `<span id="default-loading-template">Loading template...</span>`
    }
  ],
  imports: [CommonModule, RouterModule.forChild(routes), TranslocoModule]
})
export class MergedScopeModule {}
