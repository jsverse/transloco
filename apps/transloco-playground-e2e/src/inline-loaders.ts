import { Page } from '@playwright/test';

import { expectContains } from './utils';

export async function testInlineLoadersContent(page: Page, lang = 'english') {
  // The inline scope's own i18n files capitalize the language name
  // ("Inline Loaders English"), unlike every other translation file in the
  // playground ("home english") - expectContains is case-sensitive.
  const capitalizedLang = lang.charAt(0).toUpperCase() + lang.slice(1);

  // Directive
  await expectContains(
    page,
    `[data-cy=d-title]`,
    `Inline Loaders ${capitalizedLang}`,
  );
  await expectContains(page, `[data-cy=d-global]`, `alert global ${lang}`);

  // Pipe
  await expectContains(
    page,
    `[data-cy=p-title]`,
    `Inline Loaders ${capitalizedLang}`,
  );

  // Async (selectTranslate)
  await expectContains(
    page,
    `[data-cy=async-title]`,
    `Inline Loaders ${capitalizedLang}`,
  );

  // Signal (translateSignal) - regression coverage: translateSignal must
  // auto-prefix an unprefixed key ('title') with the route-provided scope,
  // same as the Directive/Pipe/Async rows above.
  await expectContains(
    page,
    `[data-cy=s-title]`,
    `Inline Loaders ${capitalizedLang}`,
  );
}
