import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import nodePath from 'node:path';

let pkgName = process.argv[2];

if (pkgName === 'docs') {
  execSync('npm run build --prefix=./docs', { stdio: 'inherit' });
  process.exit();
}

const possibleTargets = resolveSubDirs('libs').concat(resolveSubDirs('apps'));

pkgName =
  pkgName === 'transloco'
    ? pkgName
    : ['transloco', pkgName].filter(Boolean).join('-');

if (!possibleTargets.includes(pkgName)) {
  console.error(
    `Resolved package name is '${pkgName}', which is not an app or a lib`,
  );
  process.exit(1);
}

if (pkgName === 'transloco-schematics') {
  console.warn(
    `⚠️ Notice that you are building the schematics library which is actually a part of the transloco lib`,
  );
}

let cmd = `nx build ${pkgName}`;
if (pkgName === 'transloco') {
  cmd = [
    cmd,
    'nx build transloco-schematics',
    'rimraf dist/libs/transloco/schematics/package.json',
  ].join('&&');
}

execSync(cmd, { stdio: 'inherit' });

function resolveSubDirs(path) {
  return readdirSync(nodePath.resolve(process.cwd(), path), {
    withFileTypes: true,
  })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}
