import { MessageFormatTranspiler } from '@ngneat/transloco';

describe('MessageFormatTranslocoParser', () => {
  const parser = new MessageFormatTranspiler();

  it('should translate simple SELECT messageformat string from params when first param given', () => {
    const parsed = parser.transpile(
      'The { gender, select, male {boy won his} female {girl won her} other {person won their}} race',
      { gender: 'male' },
      {}
    );
    expect(parsed).toEqual('The boy won his race');
  });

  it('should translate simple SELECT messageformat string from params when second param given', () => {
    const parsed = parser.transpile(
      'The { gender, select, male {boy won his} female {girl won her} other {person won their}} race',
      { gender: 'female' },
      {}
    );
    expect(parsed).toEqual('The girl won her race');
  });

  it('should translate simple SELECT messageformat string from params when no param given', () => {
    const parsed = parser.transpile(
      'The { gender, select, male {boy won his} female {girl won her} other {person won their}} race',
      { gender: '' },
      {}
    );
    expect(parsed).toEqual('The person won their race');
  });

  it('should translate simple parmas and SELECT messageformat string from params when no param given', () => {
    const parsed = parser.transpile(
      'The {{value}} { gender, select, male {boy won his} female {girl won her} other {person won their}} race',
      { value: 'smart', gender: '' },
      {}
    );
    expect(parsed).toEqual('The smart person won their race');
  });

  it('should translate simple string from params', () => {
    const parsed = parser.transpile('Hello {{ value }}', { value: 'World' }, {});
    expect(parsed).toEqual('Hello World');
  });

  it('should translate simple string with multiple params', () => {
    const parsed = parser.transpile('Hello {{ from }} {{ name }}', { name: 'Transloco', from: 'from' }, {});
    expect(parsed).toEqual('Hello from Transloco');
  });

  it('should translate simple string with a key from lang', () => {
    const parsed = parser.transpile('Hello {{ world }}', {}, { world: 'World' });
    expect(parsed).toEqual('Hello World');
  });

  it('should translate simple string multiple keys from lang', () => {
    const lang = { withKeys: 'with keys', from: 'from', lang: 'lang', nes: { ted: 'supporting nested values!' } };
    const parsed = parser.transpile('Hello {{ withKeys }} {{ from }} {{ lang }} {{nes.ted}}', {}, lang);
    expect(parsed).toEqual('Hello with keys from lang supporting nested values!');
  });

  it('should translate simple string with params and from lang', () => {
    const parsed = parser.transpile('Hello {{ from }} {{ name }}', { name: 'Transloco' }, { from: 'from' });
    expect(parsed).toEqual('Hello from Transloco');
  });

  it('should return the given value when the value is falsy', () => {
    expect(parser.transpile('', {}, {})).toEqual('');
    expect(parser.transpile(null, {}, {})).toEqual(null);
    expect(parser.transpile(undefined, {}, {})).toEqual(undefined);
  });

  it('should support params', () => {
    const translations = {
      nested: {
        messageFormatWithParams:
          'Can replace {{value}} and also give parse messageformat: The {gender, select, male {boy won his} female {girl won her} other {person won their}} race - english',
        people: '{count, plural, =1 {person} other {people}}',
        moreNesting: {
          projects: '{count, plural, =1 {project} other {projects}}'
        }
      }
    };

    expect(
      parser.transpile(
        translations.nested,
        {
          messageFormatWithParams: { value: 'Hey', gender: 'female' },
          people: { count: '1' },
          'moreNesting.projects': { count: '1' }
        },
        {}
      )
    ).toEqual({
      messageFormatWithParams: 'Can replace Hey and also give parse messageformat: The girl won her race - english',
      people: 'person',
      moreNesting: {
        projects: 'project'
      }
    });
  });
});
