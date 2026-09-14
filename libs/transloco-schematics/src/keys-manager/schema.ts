import { Schema } from '@schematics/angular/module/schema';

export type KeysManagerStrategy = 'CLI' | 'Webpack Plugin' | 'Both';

export interface SchemaOptions extends Schema {
  /**
   *  The strategy which will be used to work with the CLI.
   */
  strategy: KeysManagerStrategy;
  /**
   * The folder that contain the root translation files.
   */
  translationPath: string;
  /**
   * The languages that being used in the project.
   */
  langs: string;
  /**
   * The root project name.
   */
  project: string;
}
