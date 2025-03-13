import type { WaitOptions } from './types';

/**
 * Parse and normalize options for waiting
 * 
 * @param options Raw options to be parsed
 * @returns Normalized WaitOptions
 */
export function parseOptions(options: Partial<WaitOptions>): Required<WaitOptions> {
  return {
    resources: options.resources || [],
    delay: options.delay ?? 0,
    interval: options.interval ?? 250,
    log: options.log ?? false,
    reverse: options.reverse ?? false,
    simultaneous: options.simultaneous ?? Infinity,
    timeout: options.timeout ?? Infinity,
    verbose: options.verbose ?? false,
    window: Math.max(options.window ?? 750, options.interval ?? 250),
    strategy: options.strategy ?? 'all',
    threshold: options.threshold ?? (options.resources ? options.resources.length : 0),
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