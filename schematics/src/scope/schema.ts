import { Schema } from '@schematics/angular/module/schema';

export enum TranslationFileTypes {
  Typescript = 'Typescript',
  JSON = 'JSON'
}

export interface SchemaOptions extends Schema {
  name: string;
  /**
   * The languages of the project.
   */
  langs: string;
  /**
   * Skip the creation of the translation files.
   */
  skipCreateTranslations: boolean;
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
}
