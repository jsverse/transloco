import { Component } from '@angular/core';

import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-lazy',
  templateUrl: './lazy.component.html',
  styleUrls: ['./lazy.component.scss'],
  standalone: true,
  imports: [TranslocoModule],
})
export default class LazyComponent {}
