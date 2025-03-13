// src/index.ts
import { iwait, iwaitImpl } from './core';
import { parseOptions } from './options';
import type { WaitOptions, ResourceState, WaitResult } from './types';

export { iwait, parseOptions };
export type { WaitOptions, ResourceState, WaitResult };

// Default export for CommonJS compatibility
export default iwait;