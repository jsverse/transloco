import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InlineLoadersRoutingModule } from './inline-loaders-routing.module';
import { InlineComponent } from './inline/inline.component';
import { TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [InlineComponent],
  imports: [TranslocoModule, CommonModule, InlineLoadersRoutingModule]
})
export class InlineLoadersModule {}
