import { Schema } from '@schematics/angular/module/schema';

export enum TranslationFileTypes {
  Typescript = 'Typescript',
  JSON = 'JSON',
}

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
   * The translation files type.
   */
  translateType: TranslationFileTypes;
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
