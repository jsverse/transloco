import { ModuleWithProviders, NgModule } from '@angular/core';
import { PersistLangConfig, TRANSLOCO_PERSIST_LANG_CONFIG } from './persist-lang.config';
import { TranslocoPersistLangService } from './persist-lang.service';

@NgModule({})
export class TranslocoPersistLangModule {
  static init(config?: PersistLangConfig): ModuleWithProviders {
    return {
      ngModule: TranslocoPersistLangModule,
      providers: [{ provide: TRANSLOCO_PERSIST_LANG_CONFIG, useValue: config }]
    };
  }

  constructor(private service: TranslocoPersistLangService) {}
}
