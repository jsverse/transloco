import { ExtractionResult } from '../types.js';

export function initExtraction(): ExtractionResult {
  return { scopeToKeys: { __global: {} }, fileCount: 0 };
}
