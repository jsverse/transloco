export enum Loaders {
  Http = 'Http',
  Webpack = 'Webpack',
}

export interface SchemaOptions {
  /**
   * The languages of the project.
   */
  langs: string;
  /**
   * The translations loader
   */
  loader: Loaders;
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
  /**
   * If the user is working with server side rendering.
   */
  ssr: boolean;
  /**
   * If the user is working with server side rendering.
   */
  translocoKeysManager: boolean;
}
