export interface SchemaOptions {
  /**
   * The path to the source root directory.
   */
  path: string;
  /**
   * Where is the migration from.
   */
  from: 'Angular' | 'NgxTranslate';
}
