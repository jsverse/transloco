import { Schema } from '@schematics/angular/module/schema';

export interface SchemaOptions extends Schema {
  name: string;
  /**
   * The languages of the project.
   */
  langs: string | string[];
  /**
   * Skip the creation of the translation files.
   */
  skipCreation: boolean;
  /**
   * The path of the translation files.
   */
  translationPath: string;
  /**
   * Specification of the declaring module..
   */
  module: string;
  /**
   * The root project name.
   */
  project: string;
  /**
   * Should create scope with inline loader.
   */
  inlineLoader: boolean;
}
