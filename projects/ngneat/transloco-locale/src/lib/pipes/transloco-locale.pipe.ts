import { ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Locale } from '../../lib/transloco-locale.types';
import { TranslocoLocaleService } from '../transloco-locale.service';

export class TranslocoLocalePipe {
  private subscription: Subscription;

  constructor(protected translocoLocaleService: TranslocoLocaleService, protected cdr: ChangeDetectorRef) {
    this.subscription = this.translocoLocaleService.localeChanges$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  protected getLocale(locale: Locale | undefined): Locale {
    return locale || this.translocoLocaleService.getLocale();
  }

  onDestroy(): void {
    this.subscription.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.subscription = null;
  }
}
