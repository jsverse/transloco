import { Schema } from '@schematics/angular/module/schema';

export interface SchemaOptions extends Schema {
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
  project?: string;
}
