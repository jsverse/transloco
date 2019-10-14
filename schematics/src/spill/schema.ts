import { Schema } from '@schematics/angular/module/schema';
import { TranslationFileFormat } from '../types';

export interface SchemaOptions extends Schema {
  /**
   * The folder that contain the root translation files.
   */
  translationPath: string;
  /**
   * The translated files format.
   */
  format: TranslationFileFormat;
  /**
   * The source directory that contain the translated files.
   */
  source: string;
  /**
   * The root project name.
   */
  project: string;
}
