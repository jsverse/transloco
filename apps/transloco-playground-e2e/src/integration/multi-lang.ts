let runs = 0;
export function testMultiLangContent(lang = 'english', testProvider = true) {
  runs++;
  cy.get(`[data-cy=global]`).should('contain', `home ${lang}`);
  cy.get(`[data-cy=with-scope]`).should('contain', `Admin Lazy ${lang}`);
  testProvider && cy.get(`[data-cy=in-provider]`).should('contain', `home ${lang}`);
  cy.get(`[data-cy=inline]`).should('contain', `home ${lang}`);
}
