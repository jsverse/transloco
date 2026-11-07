import { marker } from '../marker';

describe('marker', () => {
  it(`GIVEN a key
      WHEN it is passed to marker
      THEN the same key comes back`, () => {
    expect(marker('some.key')).toBe('some.key');
  });

  it(`GIVEN a list of keys
      WHEN it is passed to marker
      THEN the same list comes back`, () => {
    const keys = ['a', 'b'];

    expect(marker(keys)).toBe(keys);
  });

  it(`GIVEN a key and a scope
      WHEN they are passed to marker
      THEN only the key comes back`, () => {
    expect(marker('some.key', undefined, 'scope')).toBe('some.key');
  });
});
