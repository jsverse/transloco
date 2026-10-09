import { describe, beforeAll, afterEach } from 'vitest';

import { resetScopes } from '../../keys-builder/utils/scope.utils.js';
import { FileFormats } from '../../types.js';
import { spyOnConsole, spyOnProcess } from '../spec-utils.js';

import { testPipeExtraction } from './template-extraction/pipe/pipe-spec.js';
import { testDirectiveExtraction } from './template-extraction/directive/directive-spec.js';
import { testNgContainerExtraction } from './template-extraction/ng-container/ng-container-spec.js';
import { testNgTemplateExtraction } from './template-extraction/ng-template/ng-template-spec.js';
import { testControlFlowExtraction } from './template-extraction/control-flow/control-flow-spec.js';
import { testBoundaryExtraction } from './template-extraction/boundary/boundary-spec.js';
import { testPrefixExtraction } from './template-extraction/prefix/prefix-spec.js';
import { testScopeExtraction } from './template-extraction/scope/scope-spec.js';
import { testServiceExtraction } from './ts-extraction/service/service-spec.js';
import { testPureFunctionExtraction } from './ts-extraction/pure-function/pure-function-spec.js';
import { testMarkerExtraction } from './ts-extraction/marker/marker-spec.js';
import { testSignalExtraction } from './ts-extraction/signal/signal-spec.js';
import { testInlineTemplateExtraction } from './ts-extraction/inline-template/inline-template-spec.js';
import { testRouteTitleExtraction } from './ts-extraction/route-title/route-title-spec.js';
import { testRouteTitleNoProviderExtraction } from './ts-extraction/route-title-no-provider/route-title-no-provider-spec.js';
import { testCommentsExtraction } from './comments/comments-spec.js';
import { testUnflatSortExtraction } from './config-options/unflat-sort/unflat-sort-spec.js';
import { testUnflatProblomaticKeysConfig } from './config-options/unflat-problematic-keys/unflat-problomatic-keys-spec.js';
import { testUnflatExtraction } from './config-options/unflat/unflat-spec.js';
import { testScopeMappingConfig } from './config-options/scope-mapping/scope-mapping-spec.js';
import { testRemoveExtraKeysConfig } from './config-options/remove-extra-keys/remove-extra-keys-spec.js';
import { testMultiInputsConfig } from './config-options/multi-input/multi-input-spec.js';

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

    testBoundaryExtraction(fileFormat);

    testPrefixExtraction(fileFormat);

    testScopeExtraction(fileFormat);
  });

  describe('Typescript Extraction', () => {
    testServiceExtraction(fileFormat);

    testPureFunctionExtraction(fileFormat);

    testMarkerExtraction(fileFormat);

    testSignalExtraction(fileFormat);

    testInlineTemplateExtraction(fileFormat);

    testRouteTitleExtraction(fileFormat);

    testRouteTitleNoProviderExtraction(fileFormat);
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
