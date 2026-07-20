import { isLocaleFormat } from '../helpers';

describe('isLocaleFormat', () => {
  describe('valid BCP 47 tags', () => {
    it(`GIVEN a single primary language subtag (e.g. "en", "de", "fr")
        WHEN calling isLocaleFormat
        THEN should return true`, () => {
      expect(isLocaleFormat('de')).toBeTrue();
      expect(isLocaleFormat('en')).toBeTrue();
      expect(isLocaleFormat('fr')).toBeTrue();
    });

    it(`GIVEN a standard language-REGION tag (e.g. "en-US", "de-DE")
        WHEN calling isLocaleFormat
        THEN should return true`, () => {
      expect(isLocaleFormat('en-US')).toBeTrue();
      expect(isLocaleFormat('de-DE')).toBeTrue();
      expect(isLocaleFormat('fr-FR')).toBeTrue();
    });

    it(`GIVEN a lowercase region code as returned by Safari (e.g. "en-us")
        WHEN calling isLocaleFormat
        THEN should return true`, () => {
      expect(isLocaleFormat('de-de')).toBeTrue();
      expect(isLocaleFormat('en-us')).toBeTrue();
    });

    it(`GIVEN a tag with script subtags (e.g. "zh-Hant", "sr-Latn-RS")
        WHEN calling isLocaleFormat
        THEN should return true`, () => {
      expect(isLocaleFormat('zh-Hant')).toBeTrue();
      expect(isLocaleFormat('zh-Hant-TW')).toBeTrue();
      expect(isLocaleFormat('sr-Latn-RS')).toBeTrue();
    });
  });

  describe('invalid values', () => {
    it(`GIVEN null or undefined
        WHEN calling isLocaleFormat
        THEN should return false`, () => {
      expect(isLocaleFormat(null)).toBeFalse();
      expect(isLocaleFormat(undefined)).toBeFalse();
    });

    it(`GIVEN an empty string
        WHEN calling isLocaleFormat
        THEN should return false`, () => {
      expect(isLocaleFormat('')).toBeFalse();
    });

    it(`GIVEN a non-string primitive (number or boolean)
        WHEN calling isLocaleFormat
        THEN should return false`, () => {
      expect(isLocaleFormat(42)).toBeFalse();
      expect(isLocaleFormat(true)).toBeFalse();
    });

    it(`GIVEN a malformed tag (spaces, digits-only, or underscore separator)
        WHEN calling isLocaleFormat
        THEN should return false`, () => {
      expect(isLocaleFormat('not valid')).toBeFalse();
      expect(isLocaleFormat('123')).toBeFalse();
      expect(isLocaleFormat('en_US')).toBeFalse();
    });
  });
});
