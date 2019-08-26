import { testHomeContent } from './home';
import { generateLazyContent, generateContentWithoutLoader } from './lazy';
import { testScopeSharingContent } from './scope-sharing';
import { testDynamicContent } from './dynamic-translation';
import { testMultiLangContent } from './multi-lang';
import { testTranspilersContent } from './transpilers';
import { generateContentLoader } from './lazy';

function changeLang(lang) {
  cy.get(`[data-cy=${lang}]`).click();
}

describe('Transloco Full Cycle', () => {
  it('should translate to english', () => {
    /* Test home page */

    cy.visit('');
    testHomeContent();
    changeLang('es');
    testHomeContent('spanish');
    changeLang('en');
    testHomeContent();

    /* Test lazy page */

    cy.visit('/lazy');
    /* it should display lazy translation */
    changeLang('es');
    generateLazyContent('spanish');
    changeLang('en');
    generateLazyContent();
    /* should not display loader template after loaded once */
    changeLang('es');
    changeLang('en');
    generateContentWithoutLoader();

    /* Test scope sharing page */

    cy.visit('scope-sharing');
    testScopeSharingContent();
    changeLang('es');
    testScopeSharingContent('spanish');

    /* Test dynamic translation page */

    cy.visit('/dynamic-translation');
    testDynamicContent();

    /* Test multi langs page */

    cy.visit('/multilangs');
    cy.get(`[data-cy=in-provider]`).should('contain', 'home spanish');
    changeLang('en');
    testMultiLangContent('english', false);
    changeLang('es');
    testMultiLangContent('spanish');

    /* Test transpilers page */

    cy.visit('/transpilers');
    changeLang('en');
    testTranspilersContent();
    changeLang('es');
    testTranspilersContent('spanish');
    changeLang('en');
    testTranspilersContent();
  });
});

describe('Lazy Load', () => {
  beforeEach(() => {
    cy.visit('/lazy');
  });

  it('should display loading template', () => {
    generateContentLoader();
  });

  it('should display lazy translation', () => {
    cy.get(`[data-cy=es]`).click();

    generateLazyContent('spanish');

    cy.get(`[data-cy=en]`).click();
    generateLazyContent();
  });

  it('should not display loader template after loaded once', () => {
    cy.get(`[data-cy=es]`).click();
    cy.get(`[data-cy=en]`).click();

    generateContentWithoutLoader();
  });
});
