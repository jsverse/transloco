import { getLangFromScope, getPipeValue, getScopeFromLang } from './shared';

type LangResolverParams = {
  inline: string | undefined;
  provider: string | undefined;
  active: string | undefined;
};

export class LangResolver {
  initialized = false;

  // inline => provider => active
  resolve(
    { inline, provider, active }: LangResolverParams = { inline: undefined, provider: undefined, active: undefined }
  ) {
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
      const [_, extracted] = getPipeValue(provider, 'static');
      lang = extracted;
    }

    if (inline) {
      const [_, extracted] = getPipeValue(inline, 'static');
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
  resolveLangPath(lang: string, scope: string | undefined) {
    return scope ? `${scope}/${lang}` : lang;
  }
}
