import { Page } from '@playwright/test';

import { expectContains } from './utils';

export async function testLocaleContentUS(page: Page) {
  const date = new Date(2019, 7, 14, 0, 0, 0, 0);
  const dateTimeOptions: any = { timeStyle: 'full', timeZone: 'UTC' };
  const expectedFullTime = Intl.DateTimeFormat('en-US', dateTimeOptions).format(
    date,
  );

  // Date Pipe
  await expectContains(page, `[data-cy=date-regular]`, '8/14/2019');
  await expectContains(page, `[data-cy=date-long]`, 'August 14, 2019 at');
  await expectContains(
    page,
    `[data-cy=date-full]`,
    'Wednesday, August 14, 2019 at',
  );
  await expectContains(page, `[data-cy=date-full-utc]`, expectedFullTime);
  await expectContains(page, `[data-cy=date-medium-unix]`, 'Jan 1, 1970');
  await expectContains(page, `[data-cy=date-medium-string]`, 'Feb 8, 2019');

  // Numbers Pipe
  await expectContains(page, `[data-cy=number-decimal]`, ' 1,234,567,890');
  await expectContains(page, `[data-cy=number-decimal-grouped]`, '1234567890');
  await expectContains(page, `[data-cy=number-percent]`, '100%');

  // Currency Pipe
  await expectContains(page, `[data-cy=currency-symbol-only]`, '$');
  await expectContains(page, `[data-cy=currency-symbol]`, '$1,000,000.00');
  await expectContains(
    page,
    `[data-cy=currency-name]`,
    '1,000,000.00 US dollars',
  );
  await expectContains(page, `[data-cy=currency-custom-digit]`, '$1,000,000');
}

export async function testLocaleContentES(page: Page) {
  const date = new Date(2019, 7, 14, 0, 0, 0, 0);
  const dateTimeOptions: any = { timeStyle: 'full', timeZone: 'UTC' };
  const expectedFullTime = Intl.DateTimeFormat('es-ES', dateTimeOptions).format(
    date,
  );

  // Date Pipe
  await expectContains(page, `[data-cy=date-regular]`, '14/8/2019');
  await expectContains(page, `[data-cy=date-long]`, '14 de agosto de 2019');
  await expectContains(
    page,
    `[data-cy=date-full]`,
    ' miércoles, 14 de agosto de 2019,',
  );
  await expectContains(page, `[data-cy=date-full-utc]`, expectedFullTime);
  await expectContains(page, `[data-cy=date-medium-unix]`, '1 ene 1970');
  await expectContains(page, `[data-cy=date-medium-string]`, ' 8 feb 2019');

  // Numbers Pipe
  await expectContains(page, `[data-cy=number-decimal]`, ' 1.234.567.890');
  await expectContains(page, `[data-cy=number-decimal-grouped]`, '1234567890');
  await expectContains(page, `[data-cy=number-percent]`, '100');

  // Currency Pipe
  await expectContains(page, `[data-cy=currency-symbol-only]`, '€');
  await expectContains(page, `[data-cy=currency-symbol]`, '1.000.000,00');
  await expectContains(page, `[data-cy=currency-name]`, '1.000.000,00 euros');
  await expectContains(page, `[data-cy=currency-custom-digit]`, '1.000.000');
}
