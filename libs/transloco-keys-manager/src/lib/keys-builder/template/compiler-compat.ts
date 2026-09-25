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

/**
 * Structural on purpose, and deliberately named after the real `@boundary`/
 * `@error` classes Angular 22.2 exports: `@angular/compiler` doesn't have
 * `TmplAstBoundaryBlock`/`TmplAstBoundaryErrorBlock` in any currently-supported
 * version, so a named import would put symbols in the emitted `.d.ts` that
 * those typings lack. Matching the future names means the only change needed
 * once 22.2 is the minimum supported version is swapping these two aliases
 * for a `import type { ... } from '@angular/compiler'` - call sites elsewhere
 * in this package won't need to change at all.
 */
export type TmplAstBoundaryBlock = TmplAstNode & {
  children: TmplAstNode[];
  errorBlocks: TmplAstNode[];
};

export type TmplAstBoundaryErrorBlock = TmplAstNode & {
  children: TmplAstNode[];
};

type Ctor<T> = new (...args: never[]) => T;

/**
 * Reads a not-yet-existing export defensively: some test setups wrap
 * `@angular/compiler` in a strict mock proxy that throws on `get` for any
 * property missing from the mocked module, so an `in` check comes first.
 */
function readOptionalExport<T>(name: string): T | undefined {
  const source = compiler as unknown as Record<string, unknown>;
  return name in source ? (source[name] as T) : undefined;
}

/** Added in 22.2; `undefined` on earlier versions. */
const BoundaryBlockCtor = readOptionalExport<Ctor<TmplAstBoundaryBlock>>(
  'TmplAstBoundaryBlock',
);

/** Added in 22.2; `undefined` on earlier versions. */
const BoundaryErrorBlockCtor = readOptionalExport<
  Ctor<TmplAstBoundaryErrorBlock>
>('TmplAstBoundaryErrorBlock');

export function isTmplAstBoundaryBlock(
  node: unknown,
): node is TmplAstBoundaryBlock {
  return BoundaryBlockCtor !== undefined && node instanceof BoundaryBlockCtor;
}

export function isTmplAstBoundaryErrorBlock(
  node: unknown,
): node is TmplAstBoundaryErrorBlock {
  return (
    BoundaryErrorBlockCtor !== undefined &&
    node instanceof BoundaryErrorBlockCtor
  );
}
