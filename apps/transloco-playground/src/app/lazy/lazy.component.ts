import { Component } from '@angular/core';

import { TranslocoDirective } from '@ngneat/transloco';

@Component({
  selector: 'app-lazy',
  templateUrl: './lazy.component.html',
  styleUrls: ['./lazy.component.scss'],
  standalone: true,
  imports: [TranslocoDirective],
})
export default class LazyComponent {}
