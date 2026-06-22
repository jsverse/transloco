import { test } from '@playwright/test';

import { testLocaleContentES, testLocaleContentUS } from './locale';

test.describe('Locale', () => {
  test.beforeEach(async ({ page }) => {
    // Given: the locale demo page is loaded
    await page.goto('/locale');
  });

  test('should display locale pipes in en-US format', async ({ page }) => {
    // When: the en-US locale is selected
    await page.locator(`[data-cy=en]`).click();

    // Then: dates, numbers and currencies render in en-US format
    await testLocaleContentUS(page);
  });

  test('should display locale pipes in es-ES format', async ({ page }) => {
    // When: the es-ES locale is selected
    await page.locator(`[data-cy=es]`).click();

    // Then: dates, numbers and currencies render in es-ES format
    await testLocaleContentES(page);
  });
});
