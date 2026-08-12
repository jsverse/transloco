import { TranslationsService } from '@app/shared/translations';

export class TodosFacade {
  constructor(private translations: TranslationsService) {}

  notify() {
    this.translations.translate('custom-service.constructor');
    this.translations.translate('2', {}, 'other-page');
  }
}
