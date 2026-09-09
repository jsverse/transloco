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
  // Structural Directive - shared with the /lazy-multiple-scopes page, which
  // reuses the same data-cy vocabulary but not the Signal rows below.
  await expectContains(page, `[data-cy=regular]`, `Admin ${lang}`);
  await expectContains(page, `[data-cy=prefix]`, `Admin prefix ${lang}`);
  await expectContains(page, `[data-cy=lazy-page]`, `Admin Lazy ${lang}`);
}

export async function generateLazySignalContent(page: Page, lang = 'english') {
  // Signal - regression coverage for translateSignal's scope auto-prefixing.
  // /lazy only - /lazy-multiple-scopes doesn't have these rows.
  await expectContains(page, `[data-cy=s-regular]`, `Admin ${lang}`);
  await expectContains(page, `[data-cy=s-lazy-page]`, `Admin Lazy ${lang}`);
}

export async function generateContentWithoutLoader(page: Page) {
  // Structural Directive
  await expectNotExist(page, `[data-cy=lazy-page-loading]`);
}
