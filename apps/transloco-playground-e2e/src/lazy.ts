import { Page } from '@playwright/test';

import { expectContains, expectNotExist } from './utils';

export async function generateContentLoader(page: Page) {
  await expectContains(page, `[data-cy=lazy-page-loading]`, `Loading...`);
  await expectContains(
    page,
    `.transloco-loader-template`,
    `Loading template...`,
  );
}

export async function generateLazyContent(page: Page, lang = 'english') {
  // Structural Directive
  await expectContains(page, `[data-cy=regular]`, `Admin ${lang}`);
  await expectContains(page, `[data-cy=prefix]`, `Admin prefix ${lang}`);
  await expectContains(page, `[data-cy=lazy-page]`, `Admin Lazy ${lang}`);
}

export async function generateContentWithoutLoader(page: Page) {
  // Structural Directive
  await expectNotExist(page, `[data-cy=lazy-page-loading]`);
}
