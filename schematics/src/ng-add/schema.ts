export enum Loaders {
  Http = 'Http',
  Webpack = 'Webpack'
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
   * The root module name .
   */
  module: string;
}
