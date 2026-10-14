import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { splitTranslations } from '@jsverse/transloco-cli/internal/translation-files';

import { getGlobalConfig, getTranslationsRoot } from '../../schematics-core';
import {
  asSchematicsException,
  createTreeFileReader,
  deprecationWarning,
} from '../translation-files';

import { SchemaOptions } from './schema';

export default function (options: SchemaOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    context.logger.warn(deprecationWarning('split'));
    const root = getTranslationsRoot(host, options);
    const files = asSchematicsException(() =>
      splitTranslations(createTreeFileReader(host), {
        root,
        source: options.source,
        scopePathMap: getGlobalConfig().scopePathMap,
      }),
    );

    files.forEach(({ path, content }) => host.overwrite(path, content));

    return host;
  };
}
