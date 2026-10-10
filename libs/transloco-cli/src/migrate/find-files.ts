import { globSync } from 'glob';

/**
 * The files below the directory whose names end with `suffix`, as absolute
 * paths. The glob works from the directory instead of a pattern holding it, so
 * what the path is made of, a Windows drive and its backslashes included, is
 * never read as part of the pattern.
 *
 * The order is the one the glob walks the tree in, and it is kept: when two
 * templates hold the same key, the one that comes last supplies its text.
 */
export function findFiles(dir: string, suffix: string) {
  return globSync(`**/*${suffix}`, { cwd: dir, absolute: true, nodir: true });
}
