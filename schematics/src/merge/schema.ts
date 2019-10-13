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
   * The output directory.
   */
  outDir: string;
  /**
   * The root project name.
   */
  project: string;
}
