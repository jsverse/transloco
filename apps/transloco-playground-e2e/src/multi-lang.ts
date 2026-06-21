import { Page } from '@playwright/test';

import { expectContains } from './utils';

export async function testMultiLangContent(
  page: Page,
  lang = 'english',
  testProvider = true,
) {
  await expectContains(page, `[data-cy=global]`, `home ${lang}`);
  await expectContains(page, `[data-cy=with-scope]`, `Admin Lazy ${lang}`);
  if (testProvider) {
    await expectContains(page, `[data-cy=in-provider]`, `home ${lang}`);
  }
  await expectContains(page, `[data-cy=inline]`, `home ${lang}`);
}
