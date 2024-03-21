import {
  ChangeDetectorRef,
  inject,
  Injectable,
  OnDestroy,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { Locale } from '../../lib/transloco-locale.types';
import { TranslocoLocaleService } from '../transloco-locale.service';

@Injectable()
export abstract class BaseLocalePipe implements OnDestroy {
  protected localeService = inject(TranslocoLocaleService);
  protected cdr = inject(ChangeDetectorRef);

  private localeChangeSub: Subscription | null =
    this.localeService.localeChanges$.subscribe(() => this.cdr.markForCheck());

  protected getLocale(locale?: Locale): Locale {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return locale || this.localeService.getLocale()!;
  }

  ngOnDestroy(): void {
    this.localeChangeSub?.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.localeChangeSub = null;
  }
}
