import * as nodePath from 'node:path';

import { PathFragment } from '@angular-devkit/core';
import { DirEntry, Tree } from '@angular-devkit/schematics';

export function getJsonFileContent(fileName: PathFragment, dir: DirEntry) {
  const content = dir.file(fileName)!.content.toString('utf-8');
  return JSON.parse(content);
}

export function writeToJson(
  host: Tree,
  dirPath: string,
  fileName: PathFragment,
  content: unknown,
) {
  return host.overwrite(
    nodePath.join(dirPath, fileName),
    JSON.stringify(content, null, 2),
  );
}

export function hasSubdirs(dir: DirEntry): boolean {
  return dir.subdirs && dir.subdirs.length > 0;
}

export function hasFiles(dir: DirEntry): boolean {
  return dir.subfiles && dir.subfiles.length > 0;
}
