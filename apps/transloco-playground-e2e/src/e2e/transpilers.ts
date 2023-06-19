export function testTranspilersContent(lang = 'english') {
  // Structural Directive
  cy.get(`[data-cy=regular]`).should('contain', `Home - ${lang}`);
  cy.get(`[data-cy=with-params]`).should(
    'contain',
    `Replaces standard 🦄 - ${lang}`
  );
  cy.get(`[data-cy=with-translation-reuse]`).should(
    'contain',
    `a.b.c from list - ${lang}`
  );
  cy.get(`[data-cy=with-message-format]`).should(
    'contain',
    `The boy named Henkie won his race and ${lang === 'english' ? '€1,000.00' : '1000,00\u00A0€'} - ${lang}`
  );
  cy.get(`[data-cy=with-message-format-dynamic]`).should(
    'contain',
    `The girl named Kim won her race and ${lang === 'english' ? '€2,000.00' : '2000,00\u00A0€'} - ${lang}`
  );
  cy.get(`[data-cy=with-message-format-params]`).should(
    'contain',
    `Can replace transloco params and also give parse messageformat: The person named Joko won their race and ${lang === 'english' ? '€3,000.00' : '3000,00\u00A0€'} - ${lang}`
  );

  // Directive
  cy.get(`[data-cy=d-regular]`).should('contain', `Home - ${lang}`);
  cy.get(`[data-cy=d-with-params]`).should(
    'contain',
    `Replaces standard 🦄 - ${lang}`
  );
  cy.get(`[data-cy=d-with-translation-reuse]`).should(
    'contain',
    `a.b.c from list - ${lang}`
  );
  cy.get(`[data-cy=d-with-message-format]`).should(
    'contain',
    `The boy named Pete won his race and ${lang === 'english' ? '€1,100.00' : '1100,00\u00A0€'} - ${lang}`
  );
  cy.get(`[data-cy=d-with-message-format-dynamic]`).should(
    'contain',
    `The girl named Maxime won her race and ${lang === 'english' ? '€2,100.00' : '2100,00\u00A0€'} - ${lang}`
  );
  cy.get(`[data-cy=d-with-message-format-params]`).should(
    'contain',
    `Can replace transloco params and also give parse messageformat: The person named Ono won their race and ${lang === 'english' ? '€3,100.00' : '3100,00\u00A0€'} - ${lang}`
  );

  // Dynamic params
  cy.get(`[data-cy=d-with-params] .pointer`).click();
  cy.get(`[data-cy=d-with-params]`).should(
    'contain',
    `Replaces standard 🦄🦄🦄 - ${lang}`
  );
  cy.get(`[data-cy=d-with-params] .pointer`).click();
  cy.get(`[data-cy=d-with-params]`).should(
    'contain',
    `Replaces standard 🦄 - ${lang}`
  );

  // Pipe
  cy.get(`[data-cy=p-regular]`).should('contain', `Home - ${lang}`);
  cy.get(`[data-cy=p-with-params]`).should(
    'contain',
    `Replaces standard 🦄 - ${lang}`
  );
  cy.get(`[data-cy=p-with-translation-reuse]`).should(
    'contain',
    `a.b.c from list - ${lang}`
  );
  cy.get(`[data-cy=p-with-message-format]`).should(
    'contain',
    `The boy named Stef won his race and ${lang === 'english' ? '€1,200.00' : '1200,00\u00A0€'} - ${lang}`
  );
  cy.get(`[data-cy=p-with-message-format-dynamic]`).should(
    'contain',
    `The girl named Donna won her race and ${lang === 'english' ? '€2,200.00' : '2200,00\u00A0€'} - ${lang}`
  );
  cy.get(`[data-cy=p-with-message-format-params]`).should(
    'contain',
    `Can replace transloco params and also give parse messageformat: The person named Mary won their race and ${lang === 'english' ? '€3,200.00' : '3200,00\u00A0€'} - ${lang}`
  );
}
