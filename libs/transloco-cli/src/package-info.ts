import pkg from '../package.json' with { type: 'json' };

interface PackageJson {
  version: string;
  peerDependencies: Record<string, string>;
}

export function readPackageJson(): PackageJson {
  return pkg;
}
