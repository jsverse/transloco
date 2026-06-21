import { Page } from '@playwright/test';

import { expectContains } from './utils';

export async function testDynamicContent(page: Page) {
  // Set Translation Key
  await page.locator(`[data-cy=set-translation-key-btn]`).click();
  await expectContains(page, `[data-cy=set-key]`, 'New title');
  await page.locator(`[data-cy=add-key-btn]`).click();
  await expectContains(page, `[data-cy=add-key]`, 'New key');

  // Set Translation
  await page.locator(`[data-cy=add-translation-btn]`).click();
  await expectContains(
    page,
    `[data-cy=translation-object]`,
    'New translation title',
  );
}
