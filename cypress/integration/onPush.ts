import { generateContent } from './home';

describe('Transloco - onPush Component', () => {
  beforeEach(() => {
    cy.visit('/page');
  });

  it('should translate to english', () => {
    generateContent();

    cy.get(`[data-cy=es]`).click();

    generateContent('spanish');

    cy.get(`[data-cy=en]`).click();

    generateContent();
  });
});
