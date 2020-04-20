import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LocaleComponent } from './locale/locale.component';

const routes: Routes = [{ path: '', component: LocaleComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LocaleRoutingModule {}
