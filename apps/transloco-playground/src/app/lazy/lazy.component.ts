import { Component } from '@angular/core';

import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-lazy',
  templateUrl: './lazy.component.html',
  styleUrls: ['./lazy.component.scss'],
  standalone: true,
  imports: [TranslocoDirective],
})
export default class LazyComponent {}
