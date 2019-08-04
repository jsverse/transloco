import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyComponent } from './lazy.component';
import { RouterModule, Routes } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule, TRANSLOCO_LOADING_TEMPLATE } from '@ngneat/transloco';

const routes: Routes = [
  {
    path: '',
    component: LazyComponent
  }
];

@NgModule({
  declarations: [LazyComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'admin-page' },
    {
      provide: TRANSLOCO_LOADING_TEMPLATE,
      useValue: `<span id="default-loading-template">Loading template...</span>`
    }
  ],
  imports: [CommonModule, RouterModule.forChild(routes), TranslocoModule]
})
export class LazyModule {}
