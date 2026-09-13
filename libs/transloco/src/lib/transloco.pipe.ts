import {
  ChangeDetectorRef,
  Inject,
  OnDestroy,
  Optional,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { OrArray } from '@jsverse/utils';

import { TranslocoService } from './transloco.service';
import { TranslocoScope } from './transloco.types';
import { TRANSLOCO_SCOPE } from './transloco-scope';
import { TRANSLOCO_LANG } from './transloco-lang';
import { TranslationResolver } from './translation-resolver';
import { HashMap } from './utils/type.utils';

@Pipe({
  name: 'transloco',
  pure: false,
})
export class TranslocoPipe implements PipeTransform, OnDestroy {
  private subscription: Subscription | null = null;
  private lastValue = '';
  private lastKey: string | undefined;
  private translationResolver: TranslationResolver;

  constructor(
    private service: TranslocoService,
    @Optional()
    @Inject(TRANSLOCO_SCOPE)
    private providerScope: OrArray<TranslocoScope> | undefined,
    @Optional()
    @Inject(TRANSLOCO_LANG)
    private providerLang: string | undefined,
    private cdr: ChangeDetectorRef,
  ) {
    this.translationResolver = new TranslationResolver(this.service);
  }

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
      .subscribe(() => this.updateValue(key, params));

    return this.lastValue;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.subscription = null;
  }

  private updateValue(key: string, params?: HashMap | undefined) {
    const lang = this.translationResolver.resolveLang();
    this.lastValue = this.service.translate(key, params, lang);
    this.cdr.markForCheck();
  }
}
