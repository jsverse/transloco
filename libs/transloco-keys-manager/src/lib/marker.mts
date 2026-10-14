/**
 * Mirrors transloco's `HashMap`, declared locally to avoid a dependency on
 * `@jsverse/transloco`. It must stay as permissive as the `translate` params,
 * otherwise a `translate` call could not be swapped for a `marker` one.
 */
type MarkerParams = Record<string, any>;

/**
 * This function provides the capability to mark translation keys for automatic extraction with transloco.
 * If you want to extract some standalone strings that are not part of any translation call you can wrap them with the marker function to tell the keys manager to extract them.
 * The function will simply return the first "key" argument passed into it.
 *
 * @param key The translation key to extract.
 * @param params This parameter does nothing, but is required for compatibility reasons.
 * @param scope The scope to when extracting the translation key.
 */
export function marker<T extends string | string[]>(
  key: T,
  params?: MarkerParams,
  scope?: string,
): T {
  return key;
}
