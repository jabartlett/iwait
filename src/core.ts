// src/core.ts
import { parseResources } from './parser';
import { checkResource } from './checkers';
import { TimeoutError, AbortError } from './errors';
import type { WaitOptions, ResourceState, WaitResult } from './types';

/**
 * Waits for resources to become available or unavailable
 * 
 * @param options Configuration options
 * @returns Promise resolving when resources are ready according to strategy
 */
export function waitFor(options: WaitOptions): Promise<WaitResult> {
  return new Promise((resolve, reject) => {
    waitForImpl(options, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result!);
      }
    });
  });
}

/**
 * Implementation of the wait functionality with callback support
 */
export function waitForImpl(
  options: WaitOptions, 
  callback: (err?: Error, result?: WaitResult) => void
): void {
  const startTime = Date.now();
  const opts = normalizeOptions(options);
  const { 
    resources, 
    delay, 
    interval, 
    timeout, 
    verbose, 
    log, 
    reverse, 
    strategy,
    threshold,
    signal
  } = opts;
  
  // Setup logging functions
  const logFn = log ? console.log.bind(console) : () => {};
  const debugFn = verbose ? console.debug.bind(console) : () => {};
  
  // Parse resources
  const resourceDescriptors = parseResources(resources);
  
  // Track state of each resource
  const resourceStates: Record<string, ResourceState> = {};
  resources.forEach(resource => {
    resourceStates[resource] = {
      resource,
      ready: false,
      lastChecked: 0
    };
  });
  
  // Setup abort handler if signal provided
  if (signal) {
    signal.addEventListener('abort', () => {
      const error = new AbortError('Operation aborted');
      callback(error);
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    });
  }
  
  // Setup timeout if specified
  let timeoutId: NodeJS.Timeout | undefined;
  if (timeout && timeout !== Infinity) {
    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      const notReady = Object.values(resourceStates)
        .filter(r => !r.ready)
        .map(r => r.resource);
      
      const error = new TimeoutError(
        `Timed out after ${timeout}ms waiting for: ${notReady.join(', ')}`
      );
      callback(error);
    }, timeout);
  }
  
  // Helper to check if we're done based on strategy
  const checkCompletion = (): boolean => {
    const states = Object.values(resourceStates);
    const readyCount = states.filter(s => s.ready).length;
    
    switch (strategy) {
      case 'all':
        return readyCount === states.length;
      case 'any':
        return readyCount > 0;
      case 'race':
        return readyCount > 0;
      case 'threshold':
        return readyCount >= (threshold || states.length);
      default:
        return readyCount === states.length; // Default to 'all'
    }
  };
  
  // Helper to build the result object
  const buildResult = (): WaitResult => {
    const states = Object.values(resourceStates);
    const ready = states.filter(s => s.ready).map(s => s.resource);
    const notReady = states.filter(s => !s.ready).map(s => s.resource);
    const errors = states.reduce((acc, s) => {
      if (s.error) {
        acc[s.resource] = s.error;
      }
      return acc;
    }, {} as Record<string, Error>);
    
    return {
      success: checkCompletion(),
      ready,
      notReady,
      errors,
      elapsed: Date.now() - startTime
    };
  };
  
  // Logger for current state
  const logCurrentState = () => {
    if (!log) return;
    
    const states = Object.values(resourceStates);
    const readyCount = states.filter(s => s.ready).length;
    const notReady = states.filter(s => !s.ready).map(s => s.resource);
    
    if (notReady.length > 0) {
      logFn(`Waiting for ${notReady.length} resources: ${notReady.join(', ')}`);
    } else {
      logFn('All resources ready!');
    }
  };
  
  // Function to check all resources
  const checkResources = async () => {
    const descriptors = parseResources(resources);
    const checks = descriptors.map(async (descriptor, index) => {
      const resource = resources[index];
      try {
        debugFn(`Checking resource: ${resource}`);
        const isReady = await checkResource(descriptor, opts);
        const ready = reverse ? !isReady : isReady;
        
        resourceStates[resource] = {
          ...resourceStates[resource],
          ready,
          lastChecked: Date.now()
        };
        
        return { resource, ready };
      } catch (error) {
        debugFn(`Error checking resource ${resource}:`, error);
        resourceStates[resource] = {
          ...resourceStates[resource],
          error: error instanceof Error ? error : new Error(String(error)),
          lastChecked: Date.now()
        };
        
        return { resource, ready: false, error };
      }
    });
    
    await Promise.all(checks);
    logCurrentState();
    
    if (checkCompletion()) {
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(intervalId);
      
      const result = buildResult();
      callback(undefined, result);
    }
  };
  
  // Initial delay before starting
  setTimeout(() => {
    // Start periodic checking
    const intervalId = setInterval(checkResources, interval);
    
    // Do first check
    checkResources();
    
    // Handle race strategy (stop after first success)
    if (strategy === 'race') {
      const originalCheckResources = checkResources;
      checkResources = async () => {
        await originalCheckResources();
        
        // For race, we stop after first success
        if (Object.values(resourceStates).some(s => s.ready)) {
          if (timeoutId) clearTimeout(timeoutId);
          clearInterval(intervalId);
          
          const result = buildResult();
          callback(undefined, result);
        }
      };
    }
  }, delay);
}

/**
 * Normalize and apply defaults to options
 */
function normalizeOptions(options: WaitOptions): Required<WaitOptions> {
  return {
    resources: options.resources,
    delay: options.delay ?? 0,
    interval: options.interval ?? 250,
    log: options.log ?? false,
    reverse: options.reverse ?? false,
    simultaneous: options.simultaneous ?? Infinity,
    timeout: options.timeout ?? Infinity,
    verbose: options.verbose ?? false,
    window: Math.max(options.window ?? 750, options.interval ?? 250),
    strategy: options.strategy ?? 'all',
    threshold: options.threshold ?? options.resources.length,
    httpTimeout: options.httpTimeout ?? 30000,
    headers: options.headers ?? {},
    validateStatus: options.validateStatus ?? ((status) => status >= 200 && status < 300),
    followRedirect: options.followRedirect ?? true,
    basicAuth: options.basicAuth ?? { username: '', password: '' },
    tcpTimeout: options.tcpTimeout ?? 300,
    dirNotEmpty: options.dirNotEmpty ?? true,
    signal: options.signal
  };
}