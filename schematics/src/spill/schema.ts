import { Schema } from '@schematics/angular/module/schema';

export enum TranslationFileTypes {
  Typescript = 'Typescript',
  JSON = 'JSON'
}

export interface SchemaOptions extends Schema {
  /**
   * The folder that contain the root translation files.
   */
  rootTranslationPath: string;
  /**
   * The source directory that contain the translated files.
   */
  source: string;
  /**
   * The translation files format.
   */
  translateFormat: TranslationFileTypes;
  /**
   * The root project name.
   */
  project: string;
}
