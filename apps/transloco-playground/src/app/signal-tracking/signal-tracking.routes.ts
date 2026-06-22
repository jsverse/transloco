import { Route } from '@angular/router';

import { TRANSLOCO_CONFIG, translocoConfig } from '@jsverse/transloco';

export const SIGNAL_TRACKING_ROUTES: Route = {
  path: 'signal-tracking',
  loadComponent: () =>
    import('./signal-tracking.component').then(
      (m) => m.SignalTrackingComponent,
    ),
  providers: [
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig({
        availableLangs: ['en', 'es'],
        reRenderOnLangChange: true,
        defaultLang: 'en',
        useSignalTracking: true,
      }),
    },
  ],
};
