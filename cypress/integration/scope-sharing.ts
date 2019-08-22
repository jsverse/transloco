export function testScopeSharingContent(lang = 'english') {
  // Structural Directive
  cy.get(`[data-cy=todos-page-scope]`).should('contain', `My scope name was mapped! ${lang}`);
  cy.get(`[data-cy=global]`).should('contain', `home ${lang}`);

  // Directive
  cy.get(`[data-cy=d-lazy-page-scope]`).should('contain', `Admin Lazy ${lang}`);
  cy.get(`[data-cy=d-global]`).should('contain', `b`);

  // Pipe
  cy.get(`[data-cy=p-todos-page-scope]`).should('contain', `My scope name was mapped! ${lang}`);
  cy.get(`[data-cy=p-global]`).should('contain', `c`);
}
