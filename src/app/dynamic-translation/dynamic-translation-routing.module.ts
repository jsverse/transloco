import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DynamicTranslationComponent } from './dynamic-translation/dynamic-translation.component';

const routes: Routes = [
  {
    path: '',
    component: DynamicTranslationComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DynamicTranslationRoutingModule {}
