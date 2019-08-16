export function generateContent(lang = 'english') {
  // Structural Directive
  cy.get(`[data-cy=regular]`).should('contain', `Home - ${lang}`);
  cy.get(`[data-cy=with-params]`).should('contain', `Replaces standard 🦄 - ${lang}`);
  cy.get(`[data-cy=with-translation-reuse]`).should('contain', `a.b.c from list - ${lang}`);
  cy.get(`[data-cy=with-message-format]`).should('contain', `The boy won his race - ${lang}`);
  cy.get(`[data-cy=with-message-format-dynamic]`).should('contain', `The girl won her race - ${lang}`);
  cy.get(`[data-cy=with-message-format-params]`).should(
    'contain',
    `Can replace transloco params and also give parse messageformat: The person won their race - ${lang}`
  );

  // Directive
  cy.get(`[data-cy=d-regular]`).should('contain', `Home - ${lang}`);
  cy.get(`[data-cy=d-with-params]`).should('contain', `Replaces standard 🦄 - ${lang}`);
  cy.get(`[data-cy=d-with-translation-reuse]`).should('contain', `a.b.c from list - ${lang}`);
  cy.get(`[data-cy=d-with-message-format]`).should('contain', `The boy won his race - ${lang}`);
  cy.get(`[data-cy=d-with-message-format-dynamic]`).should('contain', `The girl won her race - ${lang}`);
  cy.get(`[data-cy=d-with-message-format-params]`).should(
    'contain',
    `Can replace transloco params and also give parse messageformat: The person won their race - ${lang}`
  );

  // Dynamic params
  cy.get(`[data-cy=d-with-params]`).click();
  cy.get(`[data-cy=d-with-params]`).should('contain', `Replaces standard 🦄🦄🦄 - ${lang}`);
  cy.get(`[data-cy=d-with-params]`).click();
  cy.get(`[data-cy=d-with-params]`).should('contain', `Replaces standard 🦄 - ${lang}`);

  // Pipe
  cy.get(`[data-cy=p-regular]`).should('contain', `Home - ${lang}`);
  cy.get(`[data-cy=p-with-params]`).should('contain', `Replaces standard 🦄 - ${lang}`);
  cy.get(`[data-cy=p-with-translation-reuse]`).should('contain', `a.b.c from list - ${lang}`);
  cy.get(`[data-cy=p-with-message-format]`).should('contain', `The boy won his race - ${lang}`);
  cy.get(`[data-cy=p-with-message-format-dynamic]`).should('contain', `The girl won her race - ${lang}`);
  cy.get(`[data-cy=p-with-message-format-params]`).should(
    'contain',
    `Can replace transloco params and also give parse messageformat: The person won their race - ${lang}`
  );
}

describe('Transloco Transpilers - MessageFormat', () => {
  beforeEach(() => {
    cy.visit('/transpilers');
  });

  it('should translate to english and switch to spanish', () => {
    generateContent();

    cy.get(`[data-cy=es]`).click();

    generateContent('spanish');

    cy.get(`[data-cy=en]`).click();

    generateContent();
  });
});
