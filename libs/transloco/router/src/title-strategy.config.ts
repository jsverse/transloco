import { inject, InjectionToken } from '@angular/core';

/**
 * Options for {@link provideTranslocoTitleStrategy}.
 */
export interface TranslocoTitleStrategyConfig {
  /**
   * What to do when a title key isn't found in the active language's
   * translations. This covers two cases that look identical to the
   * strategy: the key's scope hasn't finished loading yet, or the key is
   * simply wrong (a typo).
   *
   * - `'wait'` (default): don't set a title for it yet. Once the key's
   *   scope loads (or the active language changes), the title is applied.
   *   A genuinely missing key never sets a title and never logs - the
   *   tradeoff for silencing the "Missing translation" noise a loading
   *   scope would otherwise produce on every navigation and language
   *   change.
   * - `'key'`: translate it anyway, matching the pre-existing behaviour
   *   (dev-mode logs "Missing translation for '<key>'" and the untranslated
   *   key is shown as the title until it loads).
   */
  whenMissing?: 'wait' | 'key';

  /**
   * Applied to the translated title right before `Title.setTitle()`, e.g.
   * to append an app name: `(title) => \`${title} - MyApp\``.
   */
  format?: (translatedTitle: string) => string;
}

export const TRANSLOCO_TITLE_STRATEGY_CONFIG =
  /* @__PURE__ */ new InjectionToken<TranslocoTitleStrategyConfig>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_TITLE_STRATEGY_CONFIG'
      : '',
    { factory: () => ({}) },
  );

/** Resolves the provided `TRANSLOCO_TITLE_STRATEGY_CONFIG`. */
export function injectTitleStrategyConfig() {
  return inject(TRANSLOCO_TITLE_STRATEGY_CONFIG);
}
