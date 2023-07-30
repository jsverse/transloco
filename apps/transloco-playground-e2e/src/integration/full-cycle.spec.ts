import { testDynamicContent } from './dynamic-translation';
import { testHomeContent } from './home';
import {
  generateLazyContent,
  generateContentWithoutLoader,
  generateContentLoader,
} from './lazy';
import { testLocaleContentUS, testLocaleContentES } from './locale.spec';
import { testMultiLangContent } from './multi-lang';
import { testScopeSharingContent } from './scope-sharing';
import { testTranspilersContent } from './transpilers';

function changeLang(lang: string) {
  cy.get(`[data-cy=${lang}]`).click();
}

describe('Transloco Full Cycle', () => {
  it('Home page', () => {
    cy.visit('');
    testHomeContent();
    changeLang('es');
    testHomeContent('spanish');
    changeLang('en');
    testHomeContent();
  });
  it('Lazt page', () => {
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
  });
  it('Lazy multi scopes page', () => {
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
  });
  it('Scope sharing page', () => {
    cy.visit('scope-sharing');
    testScopeSharingContent();
    changeLang('es');
    testScopeSharingContent('spanish');
  });
  it('Dynamic translation page', () => {
    cy.visit('/dynamic-translation');
    testDynamicContent();
  });
  it('Multi langs page', () => {
    cy.visit('/multi-langs');
    cy.get(`[data-cy=in-provider]`).should('contain', 'home spanish');
    changeLang('en');
    testMultiLangContent('english', false);
    changeLang('es');
    testMultiLangContent('spanish');
  });
  it('Transpilers page', () => {
    cy.visit('/transpilers');
    changeLang('en');
    testTranspilersContent();
    changeLang('es');
    testTranspilersContent('spanish');
    changeLang('en');
    testTranspilersContent();
  });
  it('Transpilers page', () => {
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
    changeLang('es');
    generateLazyContent('spanish');

    changeLang('en');
    generateLazyContent();
  });

  it('should not display loader template after loaded once', () => {
    changeLang('es');
    changeLang('en');

    generateContentWithoutLoader();
  });
});
