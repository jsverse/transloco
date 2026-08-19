import { describe, it, expect } from 'vitest';
import { TmplAstSwitchBlock, parseTemplate } from '@angular/compiler';
import type {
  ASTWithSource,
  BindingPipe,
  LiteralMap,
  TmplAstElement,
} from '@angular/compiler';

import {
  isLiteralMapPropertyKey,
  isSwitchCaseChildrenOwner,
  resolveSwitchBlockChildren,
} from '../keys-builder/template/compiler-compat';
import {
  isBlockNode,
  isBlockWithChildren,
  resolveBlockChildNodes,
  resolveKeysFromLiteralMap,
} from '../keys-builder/template/utils';

/**
 * Only one `@angular/compiler` is ever installed, so the pre-21.1 shapes are
 * built by hand here - see `keys-builder/template/compiler-compat.ts`. The
 * `keys-manager-compat` CI job covers the real versions end to end.
 */

/**
 * A real `TmplAstSwitchBlock` (so `instanceof` holds) in the pre-21.1 shape:
 * cases listed flat, no `groups`.
 */
function createLegacySwitchBlock(cases: unknown[]): TmplAstSwitchBlock {
  const node = Object.create(
    TmplAstSwitchBlock.prototype,
  ) as TmplAstSwitchBlock;

  Object.assign(node, { cases });

  return node;
}

describe('compiler-compat: switch block shape', () => {
  it(`GIVEN a switch block using the pre-21.1 flat cases shape
      WHEN its children are resolved
      THEN the cases are returned`, () => {
    const caseA = { children: [] };
    const caseB = { children: [] };

    expect(
      resolveSwitchBlockChildren(createLegacySwitchBlock([caseA, caseB])),
    ).toEqual([caseA, caseB]);
  });

  it(`GIVEN a switch block using the 21.1 grouped shape
      WHEN its children are resolved
      THEN the groups are returned`, () => {
    const group = { children: [] };
    const node = Object.create(
      TmplAstSwitchBlock.prototype,
    ) as TmplAstSwitchBlock;
    Object.assign(node, { groups: [group] });

    expect(resolveSwitchBlockChildren(node)).toEqual([group]);
  });

  it(`GIVEN a switch block carrying neither shape
      WHEN its children are resolved
      THEN an empty list is returned rather than undefined`, () => {
    const node = Object.create(
      TmplAstSwitchBlock.prototype,
    ) as TmplAstSwitchBlock;

    expect(resolveSwitchBlockChildren(node)).toEqual([]);
  });

  it(`GIVEN a legacy switch block reached through the generic block walker
      WHEN its child nodes are resolved
      THEN the flat cases are still returned`, () => {
    const caseA = { children: [] };
    const node = createLegacySwitchBlock([caseA]);

    expect(isBlockNode(node)).toBe(true);
    expect(resolveBlockChildNodes(node)).toEqual([caseA]);
  });
});

describe('compiler-compat: switch case children owner', () => {
  it(`GIVEN a template using @switch
      WHEN the parsed tree is walked
      THEN the node owning the case children is recognised`, () => {
    // Checks the detection against the real AST rather than a stub.
    const { nodes } = parseTemplate(
      '@switch (cond) { @case (a) { <p>{{ t("x") }}</p> } }',
      'test.html',
    );
    const switchBlock = nodes.find(
      (node) => node instanceof TmplAstSwitchBlock,
    );

    expect(switchBlock).toBeDefined();

    const children = resolveSwitchBlockChildren(
      switchBlock as TmplAstSwitchBlock,
    );

    expect(children.length).toBeGreaterThan(0);
    expect(children.every(isSwitchCaseChildrenOwner)).toBe(true);
    expect(children.every(isBlockWithChildren)).toBe(true);
  });

  it(`GIVEN a plain object
      WHEN it is tested for being a switch case children owner
      THEN it is rejected without throwing`, () => {
    // On Angular 20 the group class is undefined, and `x instanceof undefined`
    // throws rather than returning false.
    expect(() => isSwitchCaseChildrenOwner({ children: [] })).not.toThrow();
    expect(isSwitchCaseChildrenOwner({ children: [] })).toBe(false);
    expect(isSwitchCaseChildrenOwner(null)).toBe(false);
  });
});

describe('compiler-compat: literal map keys', () => {
  it(`GIVEN a pre-21.1 literal map key with no kind discriminant
      WHEN it is classified
      THEN it counts as a property key`, () => {
    // Testing `kind === 'property'` alone empties the filter on Angular 20, and
    // `resolveKeysFromLiteralMap` then throws destructuring `propertyKeys[i]`.
    expect(isLiteralMapPropertyKey({ key: 'a', quoted: false } as never)).toBe(
      true,
    );
  });

  it(`GIVEN a 21.1 property key
      WHEN it is classified
      THEN it counts as a property key`, () => {
    expect(
      isLiteralMapPropertyKey({ kind: 'property', key: 'a' } as never),
    ).toBe(true);
  });

  it(`GIVEN a 21.1 spread key
      WHEN it is classified
      THEN it is rejected`, () => {
    expect(isLiteralMapPropertyKey({ kind: 'spread' } as never)).toBe(false);
  });
});

describe('resolveKeysFromLiteralMap: spread keys', () => {
  /** The params literal of `'greeting' | transloco: <params>`, as parsed. */
  function parseParams(params: string): LiteralMap {
    const { nodes, errors } = parseTemplate(
      `<a [title]="'greeting' | transloco: ${params}"></a>`,
      'test.html',
    );

    expect(errors ?? []).toEqual([]);

    const element = nodes[0] as TmplAstElement;
    const pipe = (element.inputs[0].value as ASTWithSource).ast as BindingPipe;

    return pipe.args[0] as LiteralMap;
  }

  it(`GIVEN params holding a spread ahead of a named key
      WHEN the keys are resolved
      THEN the named key is returned rather than the walk throwing`, () => {
    // `keys` and `values` stay parallel across a spread, so filtering the
    // spread out of `keys` alone used to run the index off the end.
    expect(
      resolveKeysFromLiteralMap(parseParams(`{ ...params, name: 'x' }`)),
    ).toEqual(['name']);
  });

  it(`GIVEN params holding a spread between two named keys
      WHEN the keys are resolved
      THEN each key keeps its own value`, () => {
    // The desync is silent rather than fatal here: `b` would have been paired
    // with the nested map that belongs to `c`.
    expect(
      resolveKeysFromLiteralMap(
        parseParams(`{ a: 1, ...params, b: 2, c: { d: 3 } }`),
      ),
    ).toEqual(['a', 'b', 'c.d']);
  });

  it(`GIVEN params holding a spread last
      WHEN the keys are resolved
      THEN the named keys are returned`, () => {
    expect(
      resolveKeysFromLiteralMap(parseParams(`{ name: 'x', ...params }`)),
    ).toEqual(['name']);
  });
});
