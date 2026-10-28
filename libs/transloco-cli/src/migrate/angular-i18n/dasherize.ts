/**
 * Replaces camelCase, underscores and spaces with dashes, the way
 * `dasherize` of `@angular-devkit/core` does. The keys of the migrated
 * templates are made with it, so a different spelling is a different key.
 */
export function dasherize(str: string) {
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[ _]/g, '-');
}
