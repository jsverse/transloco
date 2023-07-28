import * as path from 'node:path';

import {
  apply,
  move,
  Source,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';

import { stringifyList } from '../../utils/array';

export function createTranslocoModule({
  isLib,
  ssr,
  langs,
  modulePath,
  sourceRoot,
  host,
}: {
  isLib: boolean;
  ssr: boolean;
  langs: string[];
  modulePath: string;
  sourceRoot: string;
  host: Tree;
}): Source {
  const envPath = path
    .relative(modulePath, `${sourceRoot}/environments/environment`)
    .split(path.sep)
    .join('/');
  const envFileExists = host.exists(
    `${sourceRoot}/environments/environment.ts`
  );
  let prodMode = envFileExists ? 'environment.production' : '!isDevMode()';

  if (isLib) {
    prodMode = 'false';
  }

  return apply(url(`./files/transloco-module`), [
    template({
      ts: 'ts',
      stringifyList,
      isLib,
      langs,
      importEnv: ssr || envFileExists,
      envPath,
      prodMode,
    }),
    move('/', modulePath),
  ]);
}
