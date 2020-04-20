import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoLocaleModule } from '@ngneat/transloco-locale';

import { LocaleRoutingModule } from './locale-routing.module';
import { LocaleComponent } from './locale/locale.component';

@NgModule({
  declarations: [LocaleComponent],
  imports: [CommonModule, LocaleRoutingModule, TranslocoLocaleModule]
})
export class LocaleModule {}
