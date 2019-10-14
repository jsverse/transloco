import { Schema } from '@schematics/angular/module/schema';
import {TranslationFileFormat} from '../types';

export interface SchemaOptions extends Schema {
  /**
   * The folder that contain the root translation files.
   */
  translationPath: string;
  /**
   * The output directory.
   */
  outDir: string;
  /**
   *
   */
  format?: TranslationFileFormat;
  /**
   * The root project name.
   */
  project?: string;
}
