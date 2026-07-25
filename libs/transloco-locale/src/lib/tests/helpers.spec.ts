import { isLocaleFormat } from '../helpers';

describe('isLocaleFormat', () => {
  describe('valid BCP 47 tags', () => {
    it(`GIVEN a single primary language subtag (e.g. "en", "de", "fr")
        WHEN calling isLocaleFormat
        THEN should return true`, () => {
      expect(isLocaleFormat('de')).toBe(true);
      expect(isLocaleFormat('en')).toBe(true);
      expect(isLocaleFormat('fr')).toBe(true);
    });

    it(`GIVEN a standard language-REGION tag (e.g. "en-US", "de-DE")
        WHEN calling isLocaleFormat
        THEN should return true`, () => {
      expect(isLocaleFormat('en-US')).toBe(true);
      expect(isLocaleFormat('de-DE')).toBe(true);
      expect(isLocaleFormat('fr-FR')).toBe(true);
    });

    it(`GIVEN a lowercase region code as returned by Safari (e.g. "en-us")
        WHEN calling isLocaleFormat
        THEN should return true`, () => {
      expect(isLocaleFormat('de-de')).toBe(true);
      expect(isLocaleFormat('en-us')).toBe(true);
    });

    it(`GIVEN a tag with script subtags (e.g. "zh-Hant", "sr-Latn-RS")
        WHEN calling isLocaleFormat
        THEN should return true`, () => {
      expect(isLocaleFormat('zh-Hant')).toBe(true);
      expect(isLocaleFormat('zh-Hant-TW')).toBe(true);
      expect(isLocaleFormat('sr-Latn-RS')).toBe(true);
    });
  });

  describe('invalid values', () => {
    it(`GIVEN null or undefined
        WHEN calling isLocaleFormat
        THEN should return false`, () => {
      expect(isLocaleFormat(null)).toBe(false);
      expect(isLocaleFormat(undefined)).toBe(false);
    });

    it(`GIVEN an empty string
        WHEN calling isLocaleFormat
        THEN should return false`, () => {
      expect(isLocaleFormat('')).toBe(false);
    });

    it(`GIVEN a non-string primitive (number or boolean)
        WHEN calling isLocaleFormat
        THEN should return false`, () => {
      expect(isLocaleFormat(42)).toBe(false);
      expect(isLocaleFormat(true)).toBe(false);
    });

    it(`GIVEN a malformed tag (spaces, digits-only, or underscore separator)
        WHEN calling isLocaleFormat
        THEN should return false`, () => {
      expect(isLocaleFormat('not valid')).toBe(false);
      expect(isLocaleFormat('123')).toBe(false);
      expect(isLocaleFormat('en_US')).toBe(false);
    });
  });
});
