import { test } from '@playwright/test';

import { testLocaleContentES, testLocaleContentUS } from './locale';

test.describe('Locale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/locale');
  });

  test('should display locale pipes in en-US format', async ({ page }) => {
    await page.locator(`[data-cy=en]`).click();
    await testLocaleContentUS(page);
  });

  test('should display locale pipes in es-ES format', async ({ page }) => {
    await page.locator(`[data-cy=es]`).click();
    await testLocaleContentES(page);
  });
});
