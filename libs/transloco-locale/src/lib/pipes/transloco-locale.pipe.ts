import { ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Locale } from '../../lib/transloco-locale.types';
import { TranslocoLocaleService } from '../transloco-locale.service';

export class TranslocoLocalePipe {
  private subscription: Subscription | null =
    this.translocoLocaleService.localeChanges$.subscribe({
      next: () => this.cdr.markForCheck(),
    });

  constructor(
    protected translocoLocaleService: TranslocoLocaleService,
    protected cdr: ChangeDetectorRef
  ) {}

  protected getLocale(locale?: Locale): Locale {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return locale || this.translocoLocaleService.getLocale()!;
  }

  onDestroy(): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.subscription!.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.subscription = null;
  }
}
