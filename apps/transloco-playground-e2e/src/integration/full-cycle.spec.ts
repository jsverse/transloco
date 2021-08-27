import { testDynamicContent } from './dynamic-translation';
import { testHomeContent } from './home';
import {
  generateLazyContent,
  generateContentWithoutLoader,
  generateContentLoader,
} from './lazy';
import { testLocaleContentUS, testLocaleContentES } from './locale';
import { testMultiLangContent } from './multi-lang';
import { testScopeSharingContent } from './scope-sharing';
import { testTranspilersContent } from './transpilers';

function changeLang(lang: string) {
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

    cy.visit('/lazy-multiple-scopes');
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

    /* Test locale page */

    cy.visit('/locale');
    changeLang('en');
    testLocaleContentUS();
    changeLang('es');
    testLocaleContentES();
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
