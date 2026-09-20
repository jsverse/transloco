const titleStrategyProviderImport =
  /import\s*\{[^}]*\bprovideTranslocoTitleStrategy\b[^}]*\}\s*from\s*['"]@jsverse\/transloco\/router['"]/;

/**
 * Whether the file imports `provideTranslocoTitleStrategy` from
 * `@jsverse/transloco/router`. Importing it anywhere in the project is enough
 * to assume the title strategy is in use: it's typically provided once (e.g.
 * in `app.config.ts`), far from the route files declaring `title` keys, and
 * we don't try to tell an unused import from an applied provider.
 */
export function importsTitleStrategyProvider(content: string): boolean {
  return titleStrategyProviderImport.test(content);
}
