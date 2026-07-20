# Investigation: `multi: true` in `provideTranslocoScope`

## Summary

The `multi: true` flag on `TRANSLOCO_SCOPE` was originally an **opt-in** feature for users who needed
multiple translation scopes in a single component. It was unintentionally made the **default** in the
`provideTranslocoScope` helper, which introduced a subtle breaking change affecting `selectTranslate()`
and the signal API.

## Timeline

| Date           | Commit           | Change                                                                                                                                                                                                     |
| -------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2019-12-06     | PR #184 (merged) | Added multi-scope support to **directive and pipe** via `forkJoin`. Users opted in manually with `{ provide: TRANSLOCO_SCOPE, ..., multi: true }`.                                                         |
| 2023-06-xx     | `528e548f`       | `provideTranslocoScope` helper created — **no `multi: true`**.                                                                                                                                             |
| 2023-07-xx     | `5f9e687d`       | v16 standalone upgrade — still **no `multi: true`**.                                                                                                                                                       |
| **2023-07-28** | **`71d61d7e`**   | **`multi: true` added** to `provideTranslocoScope` as part of a `makeEnvironmentProviders` refactor. Commit message: "add missing provider + make environment" — no mention of the `multi: true` addition. |
| 2023-07-30     | `ec96ca69`       | Consequence noticed: `selectTranslate` now receives an array. Patched with `Array.isArray(lang) ? lang[0] : lang` — arbitrarily picking the **first** scope.                                               |
| 2024-04-xx     | `623b46f4`       | PR #758: changed signature to `...scopes: TranslocoScope[]` (spread), kept `multi: true`.                                                                                                                  |
| 2024-05-10     | `a77c79c3`       | Simplified the array check (removed `isScopeArray` helper).                                                                                                                                                |
| 2025-08-28     | PR #866          | External contributor reported that `selectTranslate` picks the wrong scope (`[0]` = parent, not the component's own scope). Proposed fix: take `[lang.length - 1]` instead.                                |

## Root Cause

Before `71d61d7e`, `provideTranslocoScope` returned a provider **without** `multi: true`.
Angular's hierarchical DI naturally shadowed parent scopes — the closest provider won.
The injected value was always a single `TranslocoScope`.

After `71d61d7e`, all `provideTranslocoScope` calls use `multi: true`, which causes Angular
to collect **all** provided scope values into an array. This changed the injected type from
`TranslocoScope` to `TranslocoScope[]` when multiple providers exist in the hierarchy.

## Inconsistency Across APIs

| API                            | Receives array?             | Handles it correctly?                    |
| ------------------------------ | --------------------------- | ---------------------------------------- |
| `*transloco` directive         | Yes                         | Yes — `forkJoin` loads all scopes        |
| `transloco` pipe               | Yes                         | Yes — `forkJoin` loads all scopes        |
| `selectTranslate()`            | Yes                         | No — picks only `[0]`, ignoring the rest |
| Signal API (`translateSignal`) | Yes (via `selectTranslate`) | No — same issue                          |

## Why `multi: true` Should Only Apply When `scopes.length > 1`

Evidence from the codebase:

1. **Single-scope tests without `multi: true` pass** — `scope-alias.spec.ts` and `pipe-integration.spec.ts`
   both provide a single `TRANSLOCO_SCOPE` without `multi: true` and work correctly.

2. **All manual multi-scope tests explicitly use `multi: true`** — `multi-scope-alias.spec.ts` provides
   two scopes, each with `multi: true`. This is the opt-in pattern from PR #184.

3. **Playground app**: 5 out of 6 `provideTranslocoScope` calls use a single scope. Only
   `lazy-multiple-scopes.component.ts` uses multiple scopes.

4. **Angular DI behavior**: with `multi: true` on a single scope, Angular wraps the value in an array
   (`[scope]`). This is unnecessary overhead — the directive/pipe check `Array.isArray` and handle both
   cases, but `selectTranslate` only handles the array case poorly.

## Action Plan

1. **Immediate (PR #866)**: Accept the `[lang.length - 1]` fix as a bugfix. Taking the last scope
   approximates Angular's "closest provider wins" behavior and fixes the reported issue. For single-scope
   users, `[0]` === `[length - 1]`, so this is a no-op.

2. **Future (breaking change)**: Two changes to align all APIs:

   a. Change `provideTranslocoScope` to only use `multi: true` when `scopes.length > 1`:

   ```ts
   export function provideTranslocoScope(...scopes: TranslocoScope[]) {
     const multi = scopes.length > 1;
     return scopes.map((scope) => ({
       provide: TRANSLOCO_SCOPE,
       useValue: scope,
       multi,
     }));
   }
   ```

   b. Update `selectTranslate()` to load **all** provided scopes when it receives an array,
   aligning it with the directive and pipe behavior. Currently, the directive and pipe use
   `forkJoin` to iterate and load every scope in the array. `selectTranslate()` should do the
   same — load all scopes so their translations are cached, then resolve the key against the
   last scope (the component's own). This ensures consistent behavior regardless of which API
   is used.

## Related Issues & PRs

- Issue #181: Original request for multi-scope support (2019)
- Issue #172: Scope providers overwrite each other (2019) — the original motivation
- PR #184: Added multi-scope to directive/pipe (2019, merged)
- PR #758 / `623b46f4`: Added spread signature (2024)
- PR #866: Fix `selectTranslate` to take last scope (2025)
- Issue #875: Cannot access all scopes with signal API (2026)
- Issue #820: Lazy loading scopes not working in component logic (2026)
