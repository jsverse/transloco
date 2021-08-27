import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';

import { DynamicTranslationRoutingModule } from './dynamic-translation-routing.module';
import { DynamicTranslationComponent } from './dynamic-translation/dynamic-translation.component';

@NgModule({
  declarations: [DynamicTranslationComponent],
  imports: [CommonModule, DynamicTranslationRoutingModule, TranslocoModule],
})
export class DynamicTranslationModule {}
