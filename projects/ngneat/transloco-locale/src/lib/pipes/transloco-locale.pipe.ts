import { ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslocoLocaleService } from '../transloco-locale.service';

export class TranslocoLocalePipe implements OnDestroy {
  private subscription: Subscription;

  constructor(protected translocoLocaleService: TranslocoLocaleService, protected cdr: ChangeDetectorRef) {
    this.subscription = this.translocoLocaleService.localeChanges$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
