import {
  ChangeDetectorRef,
  inject,
  Injectable,
  OnDestroy,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { Locale } from '../../lib/transloco-locale.types';
import { TranslocoLocaleService } from '../transloco-locale.service';

type Deps = [TranslocoLocaleService, ChangeDetectorRef];
@Injectable()
export abstract class BaseLocalePipe<VALUE = unknown, ARGS extends unknown[] = []> implements OnDestroy {
  protected localeService = inject(TranslocoLocaleService);
  protected cdr = inject(ChangeDetectorRef);

  private localeChangeSub: Subscription | null =
    this.localeService.localeChanges$.subscribe(() => this.invalidate());

  protected lastValue?: VALUE;
  protected lastArgs?: string;
  
  protected lastResult = '';
  
  protected getLocale(locale?: Locale): Locale {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return locale || this.localeService.getLocale()!;
  }

  transform(value: VALUE, ...args: ARGS): string {
    if (this.isSameValue(value) && this.isSameArgs(...args)) {
      return this.lastResult;
    }
    this.lastResult = this.doTransform(value, ...args);
    this.lastValue = value;
    this.lastArgs = JSON.stringify(args);
    return this.lastResult;
  }

  protected abstract doTransform(value: VALUE, ...args: ARGS): string;

  protected isSameValue(value: VALUE): boolean {
    return this.lastValue === value;
  }

  protected isSameArgs(...args: ARGS): boolean {
    return JSON.stringify(args) === this.lastArgs;
  }

  invalidate() {
    this.lastValue = undefined;
    this.lastArgs = undefined;
    this.lastResult = '';
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.localeChangeSub?.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.localeChangeSub = null;
  }
}
