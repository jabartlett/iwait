// src/index.ts
import { waitFor, waitForImpl } from './core';
import { parseOptions } from './options';
import type { WaitOptions, ResourceState, WaitResult } from './types';

export { waitFor, parseOptions };
export type { WaitOptions, ResourceState, WaitResult };

// Default export for CommonJS compatibility
export default waitFor;