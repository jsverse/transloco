import { InjectionToken } from '@angular/core';

export type TranslocoScope = {
  scope: string;
  alias?: string;
};

export const TRANSLOCO_SCOPE = new InjectionToken<TranslocoScope | string>('TRANSLOCO_SCOPE');
