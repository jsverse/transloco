import { InjectionToken } from '@angular/core';
import { InlineLoader } from './types';

export type TranslocoScope = {
  scope: string;
  alias?: string;
  translations?: InlineLoader;
};

export const TRANSLOCO_SCOPE = new InjectionToken<TranslocoScope | string>('TRANSLOCO_SCOPE');
