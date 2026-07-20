import { Page } from '@playwright/test';

import { expectContains } from './utils';

export async function testTranspilersContent(page: Page, lang = 'english') {
  // Structural Directive
  await expectContains(page, `[data-cy=regular]`, `Home - ${lang}`);
  await expectContains(
    page,
    `[data-cy=with-params]`,
    `Replaces standard 🦄 - ${lang}`,
  );
  await expectContains(
    page,
    `[data-cy=with-translation-reuse]`,
    `a.b.c from list - ${lang}`,
  );
  await expectContains(
    page,
    `[data-cy=with-message-format]`,
    `The boy named Henkie won his race and ${
      lang === 'english' ? '€1,000.00' : '1000,00\u00A0€'
    } - ${lang}`,
  );
  await expectContains(
    page,
    `[data-cy=with-message-format-dynamic]`,
    `The girl named Kim won her race and ${
      lang === 'english' ? '€2,000.00' : '2000,00\u00A0€'
    } - ${lang}`,
  );
  await expectContains(
    page,
    `[data-cy=with-message-format-params]`,
    `Can replace transloco params and also give parse messageformat: The person named Joko won their race and ${
      lang === 'english' ? '€3,000.00' : '3000,00\u00A0€'
    } - ${lang}`,
  );

  // Directive
  await expectContains(page, `[data-cy=d-regular]`, `Home - ${lang}`);
  await expectContains(
    page,
    `[data-cy=d-with-params]`,
    `Replaces standard 🦄 - ${lang}`,
  );
  await expectContains(
    page,
    `[data-cy=d-with-translation-reuse]`,
    `a.b.c from list - ${lang}`,
  );
  await expectContains(
    page,
    `[data-cy=d-with-message-format]`,
    `The boy named Pete won his race and ${
      lang === 'english' ? '€1,100.00' : '1100,00\u00A0€'
    } - ${lang}`,
  );
  await expectContains(
    page,
    `[data-cy=d-with-message-format-dynamic]`,
    `The girl named Maxime won her race and ${
      lang === 'english' ? '€2,100.00' : '2100,00\u00A0€'
    } - ${lang}`,
  );
  await expectContains(
    page,
    `[data-cy=d-with-message-format-params]`,
    `Can replace transloco params and also give parse messageformat: The person named Ono won their race and ${
      lang === 'english' ? '€3,100.00' : '3100,00\u00A0€'
    } - ${lang}`,
  );

  // Dynamic params
  await page.locator(`[data-cy=d-with-params] .pointer`).click();
  await expectContains(
    page,
    `[data-cy=d-with-params]`,
    `Replaces standard 🦄🦄🦄 - ${lang}`,
  );
  await page.locator(`[data-cy=d-with-params] .pointer`).click();
  await expectContains(
    page,
    `[data-cy=d-with-params]`,
    `Replaces standard 🦄 - ${lang}`,
  );

  // Pipe
  await expectContains(page, `[data-cy=p-regular]`, `Home - ${lang}`);
  await expectContains(
    page,
    `[data-cy=p-with-params]`,
    `Replaces standard 🦄 - ${lang}`,
  );
  await expectContains(
    page,
    `[data-cy=p-with-translation-reuse]`,
    `a.b.c from list - ${lang}`,
  );
  await expectContains(
    page,
    `[data-cy=p-with-message-format]`,
    `The boy named Stef won his race and ${
      lang === 'english' ? '€1,200.00' : '1200,00\u00A0€'
    } - ${lang}`,
  );
  await expectContains(
    page,
    `[data-cy=p-with-message-format-dynamic]`,
    `The girl named Donna won her race and ${
      lang === 'english' ? '€2,200.00' : '2200,00\u00A0€'
    } - ${lang}`,
  );
  await expectContains(
    page,
    `[data-cy=p-with-message-format-params]`,
    `Can replace transloco params and also give parse messageformat: The person named Mary won their race and ${
      lang === 'english' ? '€3,200.00' : '3200,00\u00A0€'
    } - ${lang}`,
  );
}
