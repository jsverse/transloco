import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyComponent } from './lazy.component';
import { RouterModule, Routes } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

const routes: Routes = [
  {
    path: '',
    component: LazyComponent
  }
];

@NgModule({
  declarations: [LazyComponent],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'admin-page' }],
  imports: [CommonModule, RouterModule.forChild(routes), TranslocoModule]
})
export class LazyModule {}
