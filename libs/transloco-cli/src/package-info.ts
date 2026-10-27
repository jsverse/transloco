import { readFileSync } from 'node:fs';
import path from 'node:path';

interface PackageJson {
  version: string;
  peerDependencies: Record<string, string>;
}

// `package.json` sits one level above this file in the sources as well as in
// the published package, where `src/` is kept next to it.
export const packageJsonPath = path.join(
  import.meta.dirname,
  '..',
  'package.json',
);

export function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
}
