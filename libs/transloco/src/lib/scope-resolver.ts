import { TranslocoScope, ProviderScope, OrArray } from './types';
import { TranslocoService } from './transloco.service';
import { isScopeObject, toCamelCase } from './helpers';

type ScopeResolverParams = {
  inline: string | undefined;
  provider: OrArray<TranslocoScope> | null;
};

export class ScopeResolver {
  constructor(private service: TranslocoService) {}

  // inline => provider
  resolve(params: ScopeResolverParams): string | undefined {
    const { inline, provider } = params;
    if (inline) {
      return inline;
    }

    if (provider) {
      if (isScopeObject(provider)) {
        const {
          scope,
          alias = this.service.config.scopes.keepCasing
            ? scope
            : toCamelCase(scope),
        } = provider as ProviderScope;
        this.service._setScopeAlias(scope, alias);

        return scope;
      }

      return provider as string;
    }

    return undefined;
  }
}
