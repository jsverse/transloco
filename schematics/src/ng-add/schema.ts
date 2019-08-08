export enum Loaders {
  Http = 'Http',
  Webpack = 'Webpack'
}

export enum TranslationFileTypes {
  Typescript = 'Typescript',
  Json = 'Json'
}

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
   * The root module name .
   */
  module: string;
}
