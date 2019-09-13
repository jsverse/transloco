import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TranslocoLocaleModule } from '@ngneat/transloco-locale';

import { LocaleRoutingModule } from './locale-routing.module';
import { LocaleComponent } from './locale/locale.component';

@NgModule({
  declarations: [LocaleComponent],
  imports: [CommonModule, LocaleRoutingModule, TranslocoLocaleModule],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'locale' }]
})
export class LocaleModule {}
