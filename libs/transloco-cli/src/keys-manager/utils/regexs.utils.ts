import { sanitizeForRegex } from './string.utils';

export const regexFactoryMap = {
  ts: {
    comments: () => /\/\*\*[^]+?\*\//g,
  },
  template: {
    comments: () => /<!--[^]+?-->/g,
    validateComment: (marker: string) =>
      new RegExp(
        `<!--(\\s*${sanitizeForRegex(marker)}\\(([^)]+)\\)\\s*)+\\s*-->`,
      ),
  },
  markerValues: (marker: string) =>
    new RegExp(`\\b${sanitizeForRegex(marker)}\\(([^)]+)\\)`, 'g'),
};
