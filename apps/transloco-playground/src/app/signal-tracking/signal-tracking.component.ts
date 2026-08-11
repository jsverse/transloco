import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-signal-tracking',
  template: `
    <ng-container *transloco="let t">
      <h1 data-cy="st-title">{{ t('home') }}</h1>
      <p data-cy="st-params">{{ t('alert', { value: '🦄' }) }}</p>
      <p data-cy="st-nested">{{ t('a.b.c') }}</p>
      <span data-cy="st-current-lang" *transloco="let t; currentLang as currentLang">{{ currentLang }}</span>
    </ng-container>
    <div data-cy="st-attribute" transloco="home"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslocoModule],
})
export class SignalTrackingComponent {}
