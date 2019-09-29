import { InjectionToken } from '@angular/core';

export interface TranslocoScope {
  scope: string;
  alias?: string;
}

export const TRANSLOCO_SCOPE = new InjectionToken<TranslocoScope | string>('TRANSLOCO_SCOPE');
