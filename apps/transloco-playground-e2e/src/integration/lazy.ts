export function generateContentLoader() {
  cy.get(`[data-cy=lazy-page-loading]`).should('contain', `Loading...`);
  cy.get(`.transloco-loader-template`).should('contain', `Loading template...`);
}

export function generateLazyContent(lang = 'english') {
  // Structural Directive
  cy.get(`[data-cy=regular]`).should('contain', `Admin ${lang}`);
  cy.get(`[data-cy=read]`).should('contain', `Admin read ${lang}`);
  cy.get(`[data-cy=lazy-page]`).should('contain', `Admin Lazy ${lang}`);
}

export function generateContentWithoutLoader() {
  // Structural Directive
  cy.get(`[data-cy=lazy-page-loading]`).should('not.exist');
}
