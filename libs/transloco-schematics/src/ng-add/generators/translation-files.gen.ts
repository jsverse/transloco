import {
  apply,
  EmptyTree,
  move,
  source,
  Tree,
} from '@angular-devkit/schematics';

export function typescriptTranslationFileCreator(source: Tree, lang: string) {
  source.create(
    `${lang}.ts`,
    `export default {};
`
  );
}

export function jsonTranslationFileCreator(source: Tree, lang: string) {
  source.create(
    `${lang}.json`,
    `{}
`
  );
}

export function createTranslateFiles(
  langs: string[],
  creator: (source: Tree, lang: string) => void,
  path
) {
  const treeSource = new EmptyTree();
  langs.forEach((lang) => {
    creator(treeSource, lang);
  });

  return apply(source(treeSource), [move('/', path)]);
}
