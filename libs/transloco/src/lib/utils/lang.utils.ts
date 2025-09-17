import { Observable, OperatorFunction, take } from 'rxjs';

import { TranslocoService } from '../transloco.service';

import { getPipeValue } from './pipe.utils';

export function shouldListenToLangChanges(
  service: TranslocoService,
  lang?: string,
) {
  const [hasStatic] = getPipeValue(lang, 'static');
  if (!hasStatic) {
    // If we didn't get 'lang|static' check if it's set in the global level
    return !!service.config.reRenderOnLangChange;
  }

  // We have 'lang|static' so don't listen to lang changes
  return false;
}

export function listenOrNotOperator<T>(
  listenToLangChange?: boolean,
): OperatorFunction<T, T> {
  return listenToLangChange ? (source: Observable<T>) => source : take<T>(1);
}
