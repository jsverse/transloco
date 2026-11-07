import fs from 'node:fs';
import path from 'node:path';

/**
 * The real path of something that may not exist yet: the real path of its
 * deepest ancestor that does, followed by the names that don't exist.
 * `unresolvable` is set when a link on the way can't be followed.
 */
export function locate(target: string) {
  const missing: string[] = [];
  let unresolvable = false;
  let current = path.resolve(target);

  for (;;) {
    try {
      const existing = fs.realpathSync(current);

      return {
        existing,
        real: path.join(existing, ...missing),
        unresolvable,
      };
    } catch (error) {
      const parent = path.dirname(current);

      if (parent === current) throw error;

      // Something is there, but cannot be followed: a link to nowhere or in a loop.
      unresolvable ||= isThere(current);
      missing.unshift(path.basename(current));
      current = parent;
    }
  }
}

const isThere = (target: string) => !!lstat(target);

/** What is at the path itself, without following a link. Nothing is `undefined`. */
export function lstat(target: string) {
  try {
    return fs.lstatSync(target);
  } catch {
    return undefined;
  }
}

/** Whether `child` is `parent` or lies below it. */
export function contains(parent: string, child: string) {
  const fold = (value: string) =>
    process.platform === 'linux' ? value : value.toLowerCase();
  const relative = path.relative(
    fold(path.resolve(parent)),
    fold(path.resolve(child)),
  );

  return (
    relative === '' ||
    (relative !== '..' &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}
