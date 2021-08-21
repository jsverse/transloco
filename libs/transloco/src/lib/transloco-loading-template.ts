import { InjectionToken, ComponentRef } from '@angular/core';

export const TRANSLOCO_LOADING_TEMPLATE = new InjectionToken<{ component: ComponentRef<unknown> | string }>(
  'TRANSLOCO_LOADING_TEMPLATE'
);
