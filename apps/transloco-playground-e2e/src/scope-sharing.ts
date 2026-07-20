import { Page } from '@playwright/test';

import { expectContains } from './utils';

export async function testScopeSharingContent(page: Page, lang = 'english') {
  // Structural Directive
  await expectContains(
    page,
    `[data-cy=todos-page-scope]`,
    `My scope name was mapped! ${lang}`,
  );
  await expectContains(page, `[data-cy=global]`, `home ${lang}`);

  // Directive
  await expectContains(
    page,
    `[data-cy=d-lazy-page-scope]`,
    `Admin Lazy ${lang}`,
  );
  await expectContains(page, `[data-cy=d-global]`, `b`);

  // Pipe
  await expectContains(
    page,
    `[data-cy=p-todos-page-scope]`,
    `My scope name was mapped! ${lang}`,
  );
  await expectContains(page, `[data-cy=p-global]`, `home ${lang}`);
}
