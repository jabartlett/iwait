// src/checkers/index.ts
import { checkFile } from './file';
import { checkHttp } from './http';
import { checkTcp } from './tcp';
import { checkSocket } from './socket';
import { checkPing } from './ping';
import { checkDir } from './directory';
import type { ResourceDescriptor, WaitOptions } from '../types';

/**
 * Check if a resource is ready
 */
export async function checkResource(
  descriptor: ResourceDescriptor, 
  options: WaitOptions
): Promise<boolean> {
  switch (descriptor.type) {
    case 'file':
      return checkFile(descriptor.uri, options);
    case 'http':
    case 'https':
      return checkHttp(descriptor.uri, 'head', descriptor.type, options);
    case 'http-get':
    case 'https-get':
      return checkHttp(
        descriptor.uri, 
        'get', 
        descriptor.type.replace('-get', '') as 'http' | 'https', 
        options
      );
    case 'tcp':
      return checkTcp(descriptor.uri, options);
    case 'socket':
      return checkSocket(descriptor.uri, options);
    case 'ping':
      return checkPing(descriptor.uri, options);
    case 'dir':
      return checkDir(descriptor.uri, options);
    default:
      throw new Error(`Unsupported resource type: ${descriptor.type}`);
  }
}

// Export individual checkers
export {
  checkFile,
  checkHttp,
  checkTcp,
  checkSocket,
  checkPing,
  checkDir
};