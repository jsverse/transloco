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
   * A list of all the translation files Path.
   */
  translationPaths: string | string[];
  /**
   * The output directory.
   */
  outDir: string;
  /**
   * The translation files format.
   */
  translateFormat: TranslationFileTypes;
  /**
   * The root project name.
   */
  project: string;
}
