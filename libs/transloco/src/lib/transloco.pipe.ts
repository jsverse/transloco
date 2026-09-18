import {
  ChangeDetectorRef,
  OnDestroy,
  Pipe,
  PipeTransform,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { TranslocoService } from './transloco.service';
import { injectTranslocoScope } from './transloco-scope';
import { injectTranslocoLang } from './transloco-lang';
import { TranslationResolver } from './translation-resolver';
import { HashMap } from './utils/type.utils';

@Pipe({
  name: 'transloco',
  pure: false,
})
export class TranslocoPipe implements PipeTransform, OnDestroy {
  private readonly translationResolver = inject(TranslationResolver);
  private readonly service = inject(TranslocoService);
  private readonly providerScope = injectTranslocoScope();
  private readonly providerLang = injectTranslocoLang();
  private readonly cdr = inject(ChangeDetectorRef);

  private subscription: Subscription | null = null;
  private lastValue = '';
  private lastKey: string | undefined;

  // null is for handling strict mode + async pipe types https://github.com/jsverse/transloco/issues/311
  // null is for handling strict mode + optional chaining types https://github.com/jsverse/transloco/issues/488
  transform(
    key?: string | null,
    params?: HashMap,
    inlineLang?: string,
  ): string {
    if (!key) {
      return key as any;
    }

    const keyName = params ? `${key}${JSON.stringify(params)}` : key;

    if (keyName === this.lastKey) {
      return this.lastValue;
    }

    this.lastKey = keyName;
    this.subscription?.unsubscribe();

    this.subscription = this.translationResolver
      .resolve({
        inlineLang,
        providerLang: this.providerLang,
        inlineScope: undefined,
        providerScope: this.providerScope ?? null,
      })
      .subscribe(({ lang }) => {
        this.lastValue = this.service.translate(key, params, lang);
        this.cdr.markForCheck();
      });

    return this.lastValue;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.subscription = null;
  }
}
