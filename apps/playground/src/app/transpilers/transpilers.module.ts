import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranspilersComponent } from './transpilers.component';
import { RouterModule, Routes } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

const routes: Routes = [
  {
    path: '',
    component: TranspilersComponent
  }
];

@NgModule({
  declarations: [TranspilersComponent],
  imports: [CommonModule, RouterModule.forChild(routes), TranslocoModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'transpilers/messageformat',
        alias: 'mf'
      }
    }
  ]
})
export class TranspilersModule {}
