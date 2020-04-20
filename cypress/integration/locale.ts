export function testLocaleContentUS() {
  // Date Pipe
  cy.get(`[data-cy=date-regular]`).should('contain', '8/14/2019');
  cy.get(`[data-cy=date-long]`).should('contain', 'August 14, 2019 at');
  cy.get(`[data-cy=date-full]`).should('contain', 'Wednesday, August 14, 2019 at');
  cy.get(`[data-cy=date-full]`).should('contain', '9:00:00 PM Coordinated Universal Time');
  cy.get(`[data-cy=date-full]`).should('contain', 'Jan 1, 1970');
  cy.get(`[data-cy=date-full]`).should('contain', 'Feb 8, 2019');

  // Numbers Pipe
  cy.get(`[data-cy=number-decimal]`).should('contain', ' 1,234,567,890');
  cy.get(`[data-cy=number-decimal]`).should('contain', '1234567890');
  cy.get(`[data-cy=number-percent]`).should('contain', '100%');

  // Currency Pipe
  cy.get(`[data-cy=currency-symbol]`).should('contain', '$1,000,000.00');
  cy.get(`[data-cy=currency-name]`).should('contain', '1,000,000.00 US dollars');
  cy.get(`[data-cy=currency-custom-digit]`).should('contain', '$1,000,000');
}

export function testLocaleContentES() {
  // Date Pipe
  cy.get(`[data-cy=date-regular]`).should('contain', '14/8/2019');
  cy.get(`[data-cy=date-long]`).should('contain', '14 de agosto de 2019');
  cy.get(`[data-cy=date-full]`).should('contain', ' miércoles, 14 de agosto de 2019,');
  cy.get(`[data-cy=date-full]`).should('contain', '21:00:00 (tiempo universal coordinado)');
  cy.get(`[data-cy=date-full]`).should('contain', '1 ene. 1970');
  cy.get(`[data-cy=date-full]`).should('contain', ' 8 feb. 2019');

  // Numbers Pipe
  cy.get(`[data-cy=number-decimal]`).should('contain', ' 1.234.567.890');
  cy.get(`[data-cy=number-decimal]`).should('contain', '1234567890');
  cy.get(`[data-cy=number-percent]`).should('contain', '100');

  // Currency Pipe
  cy.get(`[data-cy=currency-symbol]`).should('contain', '1.000.000,00');
  cy.get(`[data-cy=currency-name]`).should('contain', '1.000.000,00 euros');
  cy.get(`[data-cy=currency-custom-digit]`).should('contain', '1.000.000');
}

describe('Locale', () => {
  beforeEach(() => {
    cy.visit('/locale');
  });

  it('should display locale pipes in en-US format', () => {
    cy.get(`[data-cy=en]`).click();
    testLocaleContentUS();
  });

  it('should display locale pipes in es-ES format', () => {
    cy.get(`[data-cy=es]`).click();
    testLocaleContentES();
  });
});
