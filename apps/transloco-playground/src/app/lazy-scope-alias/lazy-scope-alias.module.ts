import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyScopeAliasComponent } from './lazy-scope-alias.component';
import { RouterModule, Routes } from '@angular/router';
import { TRANSLOCO_LOADING_TEMPLATE, TranslocoModule } from '@ngneat/transloco';

const routes: Routes = [
  {
    path: '',
    component: LazyScopeAliasComponent
  }
];

@NgModule({
  declarations: [LazyScopeAliasComponent],
  providers: [
    {
      provide: TRANSLOCO_LOADING_TEMPLATE,
      useValue: `<span id="default-loading-template">Loading template...</span>`
    }
  ],
  imports: [CommonModule, RouterModule.forChild(routes), TranslocoModule]
})
export class LazyScopeAliasModule {}
