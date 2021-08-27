import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MultilangsComponent } from './multilangs.component';

const routes: Routes = [
  {
    path: '',
    component: MultilangsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MultilangsRoutingModule {}
