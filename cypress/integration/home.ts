export function testHomeContent(lang = 'english') {
  // Structural Directive
  cy.get(`[data-cy=regular]`).should('contain', `home ${lang}`);
  cy.get(`[data-cy=with-params]`).should('contain', `alert 🦄 ${lang}`);
  cy.get(`[data-cy=with-translation-reuse]`).should('contain', `a.b.c from list ${lang}`);
  cy.get(`[data-cy=current-lang]`).should('contain', `en`);

  // Directive
  cy.get(`[data-cy=d-regular] span`).should('contain', `home ${lang}`);
  cy.get(`[data-cy=d-with-params]`).should('contain', `alert 🦄 ${lang}`);
  cy.get(`[data-cy=d-with-translation-reuse]`).should('contain', `a.b.c from list ${lang}`);
  cy.get(`[data-cy=d-dynamic-key]`).should('contain', `home ${lang}`);

  // Dynamic key
  cy.get(`[data-cy=d-dynamic-key]`).click();
  cy.get(`[data-cy=d-dynamic-key]`).should('contain', `from list`);
  cy.get(`[data-cy=d-dynamic-key]`).click();
  cy.get(`[data-cy=d-dynamic-key]`).should('contain', `home ${lang}`);

  // Dynamic params
  cy.get(`[data-cy=d-with-params]`).click();
  cy.get(`[data-cy=d-with-params]`).should('contain', `alert 🦄🦄🦄 ${lang}`);
  cy.get(`[data-cy=d-with-params]`).click();
  cy.get(`[data-cy=d-with-params]`).should('contain', `🦄 ${lang}`);

  // Pipe
  cy.get(`[data-cy=p-regular]`).should('contain', `home ${lang}`);
  cy.get(`[data-cy=p-with-params]`).should('contain', `alert 🦄 ${lang}`);
  cy.get(`[data-cy=p-with-translation-reuse]`).should('contain', `a.b.c from list ${lang}`);

  // Loop
  cy.get(`[data-cy=translation-loop]`).should('contain', `b ${lang}`);
  cy.get(`[data-cy=translation-loop]`).should('contain', `c ${lang}`);
}
