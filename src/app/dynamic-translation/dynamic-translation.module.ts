import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

import { DynamicTranslationRoutingModule } from './dynamic-translation-routing.module';
import { DynamicTranslationComponent } from './dynamic-translation/dynamic-translation.component';

@NgModule({
  declarations: [DynamicTranslationComponent],
  imports: [CommonModule, DynamicTranslationRoutingModule, TranslocoModule],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'dynamic-translation' }]
})
export class DynamicTranslationModule {}
