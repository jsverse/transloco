import { Schema } from '@schematics/angular/module/schema';

export interface SchemaOptions extends Schema {
  /**
   * The folder that contain the root translation files.
   */
  translationPath: string;
  /**
   * The default language of the project.
   */
  defaultLang: string;
  /**
   * Determine rather join also the default language
   */
  includeDefaultLang: boolean;
  /**
   * The output directory.
   */
  outDir: string;
  /**
   * The root project name.
   */
  project: string;
}
