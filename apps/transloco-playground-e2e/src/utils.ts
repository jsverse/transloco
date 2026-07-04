import { expect, Page } from '@playwright/test';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Asserts that at least one element matching `selector` contains `text`.
 *
 * Mirrors Cypress' `cy.get(selector).should('contain', text)` semantics, where
 * a selector resolving to several elements passes if *any* of them contains the
 * text. Playwright's `toContainText` throws a strict-mode violation on multiple
 * matches, so we filter by text and assert the filtered set is non-empty.
 *
 * A RegExp is used (rather than a plain string) so the match is case-sensitive
 * and runs against the raw `textContent` without whitespace normalization —
 * preserving exact substrings such as the non-breaking space (U+00A0) in the
 * locale/transpiler currency assertions.
 */
export async function expectContains(
  page: Page,
  selector: string,
  text: string,
) {
  await expect(
    page.locator(selector).filter({ hasText: new RegExp(escapeRegExp(text)) }),
  ).not.toHaveCount(0);
}

/**
 * Mirrors Cypress' `cy.get(selector).should('not.exist')`.
 */
export async function expectNotExist(page: Page, selector: string) {
  await expect(page.locator(selector)).toHaveCount(0);
}
