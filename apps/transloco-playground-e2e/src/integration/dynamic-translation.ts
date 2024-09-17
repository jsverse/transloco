export function testDynamicContent() {
  // Set Translation Key
  cy.get(`[data-cy=set-translation-key-btn]`).click();
  cy.get(`[data-cy=set-key]`).should('contain', 'New title');
  cy.get(`[data-cy=add-key-btn]`).click();
  cy.get(`[data-cy=add-key]`).should('contain', 'New key');

  // Set Translation
  cy.get(`[data-cy=add-translation-btn]`).click();
  cy.get(`[data-cy=translation-object]`).should(
    'contain',
    'New translation title',
  );
}
