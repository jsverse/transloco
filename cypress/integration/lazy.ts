export function generateContentLoader() {
  cy.get(`[data-cy=lazy-page-loading]`).should('contain', `Loading...`);
  cy.get(`.transloco-loader-template`).should('contain', `Loading template...`);
}

export function generateContent(lang = 'english') {
  // Structural Directive
  cy.get(`[data-cy=regular]`).should('contain', `Admin ${lang}`);
  cy.get(`[data-cy=lazy-page]`).should('contain', `Admin Lazy ${lang}`);
}

export function generateContentWithoutLoader() {
  // Structural Directive
  cy.get(`[data-cy=lazy-page-loading]`).should('not.exist');
}

describe('Lazy Load', () => {
  beforeEach(() => {
    cy.visit('/lazy');
  });

  it('should display loading template', () => {
    generateContentLoader();
  });

  it('should display lazy translation', () => {
    cy.get(`[data-cy=es]`).click();

    generateContent('spanish');

    cy.get(`[data-cy=en]`).click();
    generateContent();
  });

  it('should not display loader template after loaded once', () => {
    cy.get(`[data-cy=es]`).click();
    cy.get(`[data-cy=en]`).click();

    generateContentWithoutLoader();
  });
});
