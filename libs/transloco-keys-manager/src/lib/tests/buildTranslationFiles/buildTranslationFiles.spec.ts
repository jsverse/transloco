import { describe, beforeAll, afterEach } from 'vitest';

import { resetScopes } from '../../keys-builder/utils/scope.utils';
import { FileFormats } from '../../types';
import { spyOnConsole, spyOnProcess } from '../spec-utils';

import { testPipeExtraction } from './template-extraction/pipe/pipe-spec';
import { testDirectiveExtraction } from './template-extraction/directive/directive-spec';
import { testNgContainerExtraction } from './template-extraction/ng-container/ng-container-spec';
import { testNgTemplateExtraction } from './template-extraction/ng-template/ng-template-spec';
import { testControlFlowExtraction } from './template-extraction/control-flow/control-flow-spec';
import { testPrefixExtraction } from './template-extraction/prefix/prefix-spec';
import { testScopeExtraction } from './template-extraction/scope/scope-spec';
import { testServiceExtraction } from './ts-extraction/service/service-spec';
import { testPureFunctionExtraction } from './ts-extraction/pure-function/pure-function-spec';
import { testMarkerExtraction } from './ts-extraction/marker/marker-spec';
import { testSignalExtraction } from './ts-extraction/signal/signal-spec';
import { testInlineTemplateExtraction } from './ts-extraction/inline-template/inline-template-spec';
import { testCommentsExtraction } from './comments/comments-spec';
import { testUnflatSortExtraction } from './config-options/unflat-sort/unflat-sort-spec';
import { testUnflatProblomaticKeysConfig } from './config-options/unflat-problematic-keys/unflat-problomatic-keys-spec';
import { testUnflatExtraction } from './config-options/unflat/unflat-spec';
import { testScopeMappingConfig } from './config-options/scope-mapping/scope-mapping-spec';
import { testRemoveExtraKeysConfig } from './config-options/remove-extra-keys/remove-extra-keys-spec';
import { testMultiInputsConfig } from './config-options/multi-input/multi-input-spec';

const formats: FileFormats[] = ['pot', 'json'];

describe.each(formats)('buildTranslationFiles in %s', (fileFormat) => {
  beforeAll(() => {
    spyOnConsole('warn');
    spyOnProcess('exit');
  });

  // Reset to ensure the scopes are not being shared among the tests.
  afterEach(() => resetScopes());

  describe('Template Extraction', () => {
    testPipeExtraction(fileFormat);

    testDirectiveExtraction(fileFormat);

    testNgContainerExtraction(fileFormat);

    testNgTemplateExtraction(fileFormat);

    testControlFlowExtraction(fileFormat);

    testPrefixExtraction(fileFormat);

    testScopeExtraction(fileFormat);
  });

  describe('Typescript Extraction', () => {
    testServiceExtraction(fileFormat);

    testPureFunctionExtraction(fileFormat);

    testMarkerExtraction(fileFormat);

    testSignalExtraction(fileFormat);

    testInlineTemplateExtraction(fileFormat);
  });

  describe('Config options', () => {
    testUnflatExtraction(fileFormat);

    testUnflatSortExtraction(fileFormat);

    testUnflatProblomaticKeysConfig(fileFormat);

    testScopeMappingConfig(fileFormat);

    testMultiInputsConfig(fileFormat);

    testRemoveExtraKeysConfig(fileFormat);
  });

  testCommentsExtraction(fileFormat);
});
