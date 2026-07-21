import { Component } from '@angular/core';

import { TranslocoDirective, translateSignal } from '@jsverse/transloco';

@Component({
  selector: 'app-lazy',
  templateUrl: './lazy.component.html',
  styleUrls: ['./lazy.component.scss'],
  imports: [TranslocoDirective],
})
export default class LazyComponent {
  // Auto-prefixed via the `admin-page` scope provided at the route level (no
  // explicit scope argument needed).
  adminTitle = translateSignal('title');
  lazyPageTitle = translateSignal('title', undefined, 'lazy-page');
}
