// src/types.ts

// Strategy options for waiting
export type WaitStrategy = 'all' | 'any' | 'race' | 'threshold';

// Resource types we can wait for
export type ResourceType = 'file' | 'http' | 'https' | 'http-get' | 'https-get' | 'tcp' | 'socket' | 'ping' | 'dir';

// Resource descriptor parsed from input
export interface ResourceDescriptor {
  type: ResourceType;
  uri: string;
  originalUri: string;
}

// Import AbortSignal if it's not defined in the global scope
declare global {
  interface AbortSignal {
    readonly aborted: boolean;
    addEventListener(type: 'abort', listener: () => void): void;
    removeEventListener(type: 'abort', listener: () => void): void;
  }
}

// Configuration options
export interface WaitOptions {
  resources: string[];
  delay?: number;
  interval?: number;
  log?: boolean;
  reverse?: boolean;
  simultaneous?: number;
  timeout?: number;
  verbose?: boolean;
  window?: number;
  strategy?: WaitStrategy;
  threshold?: number; // For threshold strategy, how many resources need to be ready
  
  // HTTP specific options
  httpTimeout?: number;
  headers?: Record<string, string>;
  validateStatus?: (status: number) => boolean;
  followRedirect?: boolean;
  basicAuth?: {
    username: string;
    password: string;
  };
  
  // TCP specific options
  tcpTimeout?: number;
  
  // Directory specific options
  dirNotEmpty?: boolean;
  
  // Signal for abort controller
  signal?: AbortSignal;
}

// Normalized options with all fields required except signal
export interface NormalizedWaitOptions extends Omit<Required<WaitOptions>, 'signal'> {
  signal?: AbortSignal;
}

// State of a resource during waiting
export interface ResourceState {
  resource: string;
  ready: boolean;
  error?: Error;
  lastChecked: number;
}

// Result of the wait operation
export interface WaitResult {
  success: boolean;
  ready: string[];
  notReady: string[];
  errors: Record<string, Error>;
  elapsed: number;
}