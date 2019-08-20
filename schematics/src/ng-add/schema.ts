export enum Loaders {
  Http = 'Http',
  Webpack = 'Webpack'
}

export enum TranslationFileTypes {
  Typescript = 'Typescript',
  JSON = 'JSON'
}

export const translationFileExtensions: { [key in keyof typeof TranslationFileTypes]: string } = {
  JSON: 'json',
  Typescript: 'ts'
};

export interface SchemaOptions {
  /**
   * The languages of the project.
   */
  langs: string;
  /**
   * The languages of the project.
   */
  loader: Loaders;
  /**
   * The translation files type.
   */
  translateType: TranslationFileTypes;
  /**
   * The translation files folder.
   */
  path: string;
  /**
   * The root module name.
   */
  module: string;
  /**
   * The root project name.
   */
  project: string;
}
