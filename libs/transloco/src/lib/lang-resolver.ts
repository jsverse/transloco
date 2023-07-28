import { getLangFromScope, getPipeValue, getScopeFromLang } from './shared';

interface LangResolverParams {
  inline?: string;
  provider: string | null;
  active: string;
}

export class LangResolver {
  initialized = false;

  // inline => provider => active
  resolve({ inline, provider, active }: LangResolverParams): string {
    let lang = active;
    /**
     * When the user changes the lang we need to update
     * the view. Otherwise, the lang will remain the inline/provided lang
     */
    if (this.initialized) {
      lang = active;

      return lang;
    }

    if (provider) {
      const [, extracted] = getPipeValue(provider, 'static');
      lang = extracted;
    }

    if (inline) {
      const [, extracted] = getPipeValue(inline, 'static');
      lang = extracted;
    }

    this.initialized = true;

    return lang;
  }

  /**
   *
   * Resolve the lang
   *
   * @example
   *
   * resolveLangBasedOnScope('todos/en') => en
   * resolveLangBasedOnScope('en') => en
   *
   */
  resolveLangBasedOnScope(lang: string) {
    const scope = getScopeFromLang(lang);

    return scope ? getLangFromScope(lang) : lang;
  }

  /**
   *
   * Resolve the lang path for loading
   *
   * @example
   *
   * resolveLangPath('todos', 'en') => todos/en
   * resolveLangPath('en') => en
   *
   */
  resolveLangPath(lang: string, scope?: string) {
    return scope ? `${scope}/${lang}` : lang;
  }
}
