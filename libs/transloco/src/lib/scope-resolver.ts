import { TranslocoScope, ProviderScope, MaybeArray } from './types';
import { TranslocoService } from './transloco.service';
import { isScopeObject, toCamelCase } from './helpers';

type ScopeResolverParams = {
  inline: string | undefined;
  provider: MaybeArray<TranslocoScope>;
};

export class ScopeResolver {
  constructor(private translocoService: TranslocoService) {}

  // inline => provider
  resolve(
    { inline, provider }: ScopeResolverParams = {
      inline: undefined,
      provider: undefined,
    }
  ): string | undefined {
    if (inline) {
      return inline;
    }

    if (provider) {
      if (isScopeObject(provider)) {
        const { scope, alias = toCamelCase(scope) } = provider as ProviderScope;
        this.translocoService._setScopeAlias(scope, alias);

        return scope;
      }

      return provider as string;
    }

    return undefined;
  }
}
