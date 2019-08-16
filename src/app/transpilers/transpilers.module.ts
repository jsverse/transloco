import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranspilersComponent } from './transpilers.component';
import { Routes, RouterModule } from '@angular/router';
import {
  TranslocoModule,
  TRANSLOCO_TRANSPILER,
  MessageFormatTranspiler,
  TRANSLOCO_SCOPE,
  TRANSLOCO_LANG
} from '@ngneat/transloco';

const routes: Routes = [
  {
    path: '',
    component: TranspilersComponent
  }
];

@NgModule({
  declarations: [TranspilersComponent],
  imports: [CommonModule, RouterModule.forChild(routes), TranslocoModule],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'transpilers/messageformat' }]
})
export class TranspilersModule {}
