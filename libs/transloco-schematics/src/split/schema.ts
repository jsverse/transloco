import { Schema } from '@schematics/angular/module/schema';

export interface SchemaOptions extends Schema {
  /**
   * The folder that contain the root translation files.
   */
  translationPath: string;
  /**
   * The source directory that contain the translated files.
   */
  source: string;
  /**
   * The root project name.
   */
  project: string;
}
