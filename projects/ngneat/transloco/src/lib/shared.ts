import { TranslocoService } from './transloco.service';
import { getPipeValue } from './helpers';

export function shouldListenToLangChanges(service: TranslocoService, lang: string) {
  const [hasStatic] = getPipeValue(lang, 'static');
  if (hasStatic === false) {
    // If we didn't get 'lang|static' check if it's set in the global level
    return service.config.reRenderOnLangChange;
  }

  // We have 'lang|static' so don't listen to lang changes
  return false;
}
