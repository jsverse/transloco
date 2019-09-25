import { InjectionToken } from '@angular/core';

export interface TranslocoScopeInterface {
  scope: string;
  alias?: string;
}

export const TRANSLOCO_SCOPE = new InjectionToken<TranslocoScopeInterface | string>('TRANSLOCO_SCOPE');
