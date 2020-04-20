import { ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslocoLocaleService } from '../transloco-locale.service';
import { Locale } from '../../lib/transloco-locale.types';

export class TranslocoLocalePipe implements OnDestroy {
  private subscription: Subscription;

  constructor(protected translocoLocaleService: TranslocoLocaleService, protected cdr: ChangeDetectorRef) {
    this.subscription = this.translocoLocaleService.localeChanges$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  protected getLocale(locale: Locale | undefined): Locale {
    return locale || this.translocoLocaleService.getLocale();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
