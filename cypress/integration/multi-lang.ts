describe('Multi Langs', () => {
  beforeEach(() => {
    cy.visit('/multilangs');
  });

  function generateContent(lang = 'english') {
    cy.get(`[data-cy=global]`).should('contain', `home ${lang}`);
    cy.get(`[data-cy=with-scope]`).should('contain', `Admin Lazy ${lang}`);
    cy.get(`[data-cy=in-provider]`).should('contain', `home ${lang}`);
    cy.get(`[data-cy=inline]`).should('contain', `home ${lang}`);
  }

  it('should support multi langs', () => {
    cy.get(`[data-cy=global]`).should('contain', `home english`);
    cy.get(`[data-cy=with-scope]`).should('contain', `Admin Lazy spanish`);
    cy.get(`[data-cy=in-provider]`).should('contain', `home spanish`);
    cy.get(`[data-cy=inline]`).should('contain', `home english`);

    cy.get(`[data-cy=en]`).click();
    generateContent();

    cy.get(`[data-cy=es]`).click();
    generateContent('spanish');

  });
});
