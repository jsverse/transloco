// Internal entry point for the `ngx-migrate` and `ng-migrate` schematics. Not a public API.
export {
  migrateAngularI18n,
  type MigrateAngularI18nOptions,
} from './angular-i18n/migrate-angular-i18n.js';
export {
  migrateNgxTranslate,
  type MigrateNgxTranslateOptions,
} from './ngx-translate/migrate-ngx-translate.js';
