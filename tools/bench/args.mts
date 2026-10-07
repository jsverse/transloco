/**
 * What `parseArgs` lets through but a benchmark must not run with. Throws, for
 * the caller to report next to the usage.
 *
 * - An option given more than once: the last value wins, so
 *   `--files 10k --files 30k` would quietly generate the larger project.
 * - An empty or blank value: `--out ""` would fall back to the default
 *   directory and `--seed ""` would be read as the seed 0.
 */
export function assertUsableOptions(
  tokens: ReadonlyArray<{ kind: string; name?: string; value?: string }>,
) {
  const seen = new Set<string>();

  for (const token of tokens) {
    if (token.kind !== 'option' || token.name === undefined) continue;

    if (seen.has(token.name)) {
      throw new Error(`Option '--${token.name}' was given more than once`);
    }

    if (token.value !== undefined && token.value.trim() === '') {
      throw new Error(`Option '--${token.name}' cannot be empty`);
    }

    seen.add(token.name);
  }
}
