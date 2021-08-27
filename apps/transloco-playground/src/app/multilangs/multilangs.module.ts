import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MultilangsRoutingModule } from './multilangs-routing.module';
import { MultilangsComponent } from './multilangs.component';
import { TranslocoModule } from '@ngneat/transloco';
import { ProviderLangComponent } from './provider-lang/provider-lang.component';

@NgModule({
  declarations: [MultilangsComponent, ProviderLangComponent],
  imports: [CommonModule, TranslocoModule, MultilangsRoutingModule],
})
export class MultilangsModule {}
