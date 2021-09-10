import { ModuleWithProviders, NgModule } from '@angular/core';
import { TRANSLOCO_LOADER } from '@ngneat/transloco';
import { TranslocoPersistTranslations } from './transloco-persist-translations.service';
import {
  PERSIST_TRANSLATIONS_STORAGE_CONFIG,
  PERSIST_TRANSLATIONS_LOADER,
  TranslocoPersistTranslationsConfig,
} from './transloco-persist-translations.config';

@NgModule()
export class TranslocoPersistTranslationsModule {
  static forRoot(
    config: TranslocoPersistTranslationsConfig
  ): ModuleWithProviders<TranslocoPersistTranslationsModule> {
    return {
      ngModule: TranslocoPersistTranslationsModule,
      providers: [
        { provide: PERSIST_TRANSLATIONS_STORAGE_CONFIG, useValue: config },
        { provide: PERSIST_TRANSLATIONS_LOADER, useClass: config.loader },
        { provide: TRANSLOCO_LOADER, useClass: TranslocoPersistTranslations },
        config.storage,
      ],
    };
  }
}
