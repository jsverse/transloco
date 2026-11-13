import { expect, Page, test } from '@playwright/test';

import { testDynamicContent } from './dynamic-translation';
import { testHomeContent } from './home';
import {
  generateLazyContent,
  generateContentWithoutLoader,
  generateContentLoader,
} from './lazy';
import { testLocaleContentUS, testLocaleContentES } from './locale';
import { testMultiLangContent } from './multi-lang';
import { testScopeSharingContent } from './scope-sharing';
import { testActiveTranspiler, testTranspilersContent } from './transpilers';
import { expectContains } from './utils';

function changeLang(page: Page, lang: string) {
  return page.locator(`[data-cy=${lang}]`).click();
}

function isEvalBlocked(page: Page) {
  return page.evaluate(
    () =>
      new Promise<boolean>((resolve) =>
        setTimeout(() => {
          try {
            new Function('return 1')();
            resolve(false);
          } catch {
            resolve(true);
          }
        }),
      ),
  );
}

test.describe('Transloco Full Cycle', () => {
  test('Home page', async ({ page }) => {
    await page.goto('');
    await testHomeContent(page);
    await changeLang(page, 'es');
    await testHomeContent(page, 'spanish');
    await changeLang(page, 'en');
    await testHomeContent(page);
  });
  test('Lazy page', async ({ page }) => {
    await page.goto('/lazy');
    /* it should display lazy translation */
    await changeLang(page, 'es');
    await generateLazyContent(page, 'spanish');
    await changeLang(page, 'en');
    await generateLazyContent(page);
    /* should not display loader template after loaded once */
    await changeLang(page, 'es');
    await changeLang(page, 'en');
    await generateContentWithoutLoader(page);
  });
  test('Lazy multi scopes page', async ({ page }) => {
    await page.goto('/lazy-multiple-scopes');
    /* it should display lazy translation */
    await changeLang(page, 'es');
    await generateLazyContent(page, 'spanish');
    await changeLang(page, 'en');
    await generateLazyContent(page);
    /* should not display loader template after loaded once */
    await changeLang(page, 'es');
    await changeLang(page, 'en');
    await generateContentWithoutLoader(page);
  });
  test('Scope sharing page', async ({ page }) => {
    await page.goto('/scope-sharing');
    await testScopeSharingContent(page);
    await changeLang(page, 'es');
    await testScopeSharingContent(page, 'spanish');
  });
  test('Dynamic translation page', async ({ page }) => {
    await page.goto('/dynamic-translation');
    await testDynamicContent(page);
  });
  test('Multi langs page', async ({ page }) => {
    await page.goto('/multi-langs');
    await expectContains(page, `[data-cy=in-provider]`, 'home spanish');
    await changeLang(page, 'en');
    await testMultiLangContent(page, 'english', false);
    await changeLang(page, 'es');
    await testMultiLangContent(page, 'spanish');
  });
  test('Transpilers page', async ({ page }) => {
    await page.goto('/transpilers');
    await testActiveTranspiler(page, 'MessageFormat');
    await changeLang(page, 'en');
    await testTranspilersContent(page);
    await changeLang(page, 'es');
    await testTranspilersContent(page, 'spanish');
    await changeLang(page, 'en');
    await testTranspilersContent(page);
  });
  test('Transpilers page with intl-messageformat', async ({ page }) => {
    await page.goto('/transpilers?transpiler=intl');
    await testActiveTranspiler(page, 'IntlMessageFormat');
    await changeLang(page, 'en');
    await testTranspilersContent(page);
    await changeLang(page, 'es');
    await testTranspilersContent(page, 'spanish');
    await changeLang(page, 'en');
    await testTranspilersContent(page);
  });
  test('Transpilers page with intl-messageformat and no unsafe-eval', async ({
    page,
  }) => {
    await page.route('**/transpilers?transpiler=intl', async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          'content-security-policy': "script-src 'self' 'unsafe-inline'",
        },
      });
    });
    await page.goto('/transpilers?transpiler=intl');
    expect(await isEvalBlocked(page)).toBe(true);
    await testActiveTranspiler(page, 'IntlMessageFormat');
    await changeLang(page, 'en');
    await testTranspilersContent(page);
    await changeLang(page, 'es');
    await testTranspilersContent(page, 'spanish');
  });
  test('Locale page', async ({ page }) => {
    await page.goto('/locale');
    await changeLang(page, 'en');
    await testLocaleContentUS(page);
    await changeLang(page, 'es');
    await testLocaleContentES(page);
  });
});

test.describe('Lazy Load', () => {
  test('should display loading template', async ({ page }) => {
    // The lazy scope's translation file loads from disk near-instantly, so the
    // loader template would flash faster than the assertion can poll. Throttle
    // the i18n request (the app itself is untouched) so the transient loading
    // state stays visible long enough to assert it, mirroring the slow-network
    // window Cypress happened to catch.
    await page.route('**/assets/i18n/**/*.json', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.goto('/lazy');
    await generateContentLoader(page);
  });

  test('should display lazy translation', async ({ page }) => {
    await page.goto('/lazy');
    await changeLang(page, 'es');
    await generateLazyContent(page, 'spanish');

    await changeLang(page, 'en');
    await generateLazyContent(page);
  });

  test('should not display loader template after loaded once', async ({
    page,
  }) => {
    await page.goto('/lazy');
    await changeLang(page, 'es');
    await changeLang(page, 'en');

    await generateContentWithoutLoader(page);
  });
});
