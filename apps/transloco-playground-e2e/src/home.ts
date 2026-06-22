import { Page } from '@playwright/test';

import { expectContains } from './utils';

export async function testHomeContent(page: Page, lang = 'english') {
  // Structural Directive
  await expectContains(page, `[data-cy=regular]`, `home ${lang}`);
  await expectContains(page, `[data-cy=with-params]`, `alert 🦄 ${lang}`);
  await expectContains(
    page,
    `[data-cy=with-translation-reuse]`,
    `a.b.c from list ${lang}`,
  );
  await expectContains(page, `[data-cy=static-lang-en]`, `home english`);
  await expectContains(page, `[data-cy=current-lang]`, `en`);

  // Directive
  await expectContains(page, `[data-cy=d-regular] span`, `home ${lang}`);
  await expectContains(page, `[data-cy=d-with-params]`, `alert 🦄 ${lang}`);
  await expectContains(
    page,
    `[data-cy=d-with-translation-reuse]`,
    `a.b.c from list ${lang}`,
  );
  await expectContains(page, `[data-cy=d-dynamic-key]`, `home ${lang}`);
  await expectContains(page, `[data-cy=d-static-lang-es]`, `home spanish`);

  // Dynamic key
  await page.locator(`[data-cy=d-dynamic-key]`).click();
  await expectContains(page, `[data-cy=d-dynamic-key]`, `from list`);
  await page.locator(`[data-cy=d-dynamic-key]`).click();
  await expectContains(page, `[data-cy=d-dynamic-key]`, `home ${lang}`);

  // Dynamic params
  await page.locator(`[data-cy=d-with-params]`).click();
  await expectContains(page, `[data-cy=d-with-params]`, `alert 🦄🦄🦄 ${lang}`);
  await page.locator(`[data-cy=d-with-params]`).click();
  await expectContains(page, `[data-cy=d-with-params]`, `🦄 ${lang}`);

  // Pipe
  await expectContains(page, `[data-cy=p-regular]`, `home ${lang}`);
  await expectContains(page, `[data-cy=p-with-params]`, `alert 🦄 ${lang}`);
  await expectContains(
    page,
    `[data-cy=p-with-translation-reuse]`,
    `a.b.c from list ${lang}`,
  );
  await expectContains(page, `[data-cy=p-static-lang-en]`, `home english`);

  // Loop
  await expectContains(page, `[data-cy=translation-loop]`, `b ${lang}`);
  await expectContains(page, `[data-cy=translation-loop]`, `c ${lang}`);
}
