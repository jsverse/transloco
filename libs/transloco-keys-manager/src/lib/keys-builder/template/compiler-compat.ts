/**
 * Shims for the two template AST shapes Angular 21.1 changed, so the extractors
 * can be written against one shape across the supported `@angular/compiler`
 * range.
 *
 * Namespace import, not named: a named import of a symbol missing from the
 * installed version is `undefined`, and `x instanceof undefined` throws.
 */
import * as compiler from '@angular/compiler';
import type {
  LiteralMapKey,
  TmplAstNode,
  TmplAstSwitchBlock,
} from '@angular/compiler';

/**
 * Structural on purpose, for the same reason as `SwitchCaseChildrenOwner`
 * below: `LiteralMapPropertyKey` only exists from Angular 21.1, so naming it
 * would put a symbol in the emitted `.d.ts` that Angular 20's typings lack.
 */
type LiteralMapPropertyKey = LiteralMapKey & { key: string };

/**
 * Structural on purpose: naming the 21.1-only `TmplAstSwitchBlockCaseGroup`
 * would put a symbol in the emitted `.d.ts` that Angular 20's typings lack.
 */
export type SwitchCaseChildrenOwner = TmplAstNode & {
  children: TmplAstNode[];
};

/** Added in 21.1; `undefined` on 20.x-21.0. */
const SwitchBlockCaseGroup = (compiler as Partial<typeof compiler>)
  .TmplAstSwitchBlockCaseGroup;

const SwitchBlockCase = compiler.TmplAstSwitchBlockCase;

/** Pre-21.1 `@switch`, which listed cases flat instead of grouping them. */
interface LegacySwitchBlock {
  cases: TmplAstNode[];
}

/**
 * 21.1 moved `children` off `@case` and onto the new group node, so which class
 * owns them depends on the installed version.
 */
export function isSwitchCaseChildrenOwner(
  node: unknown,
): node is { children: TmplAstNode[] } {
  return SwitchBlockCaseGroup
    ? node instanceof SwitchBlockCaseGroup
    : node instanceof SwitchBlockCase;
}

export function resolveSwitchBlockChildren(
  node: TmplAstSwitchBlock,
): TmplAstNode[] {
  const groups = (node as Partial<TmplAstSwitchBlock>).groups;

  return groups ?? (node as unknown as LegacySwitchBlock).cases ?? [];
}

/**
 * 21.1 tagged `LiteralMapKey` with `kind` to make room for spread keys. Before
 * that every key was a property key, so a missing discriminant means `true` -
 * testing `kind === 'property'` alone drops every key on Angular 20.
 */
export function isLiteralMapPropertyKey(
  key: LiteralMapKey,
): key is LiteralMapPropertyKey {
  return 'kind' in key ? key.kind === 'property' : true;
}
