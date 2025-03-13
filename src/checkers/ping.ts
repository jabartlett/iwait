// src/checkers/ping.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import type { WaitOptions } from '../types';

const execPromise = promisify(exec);

/**
 * Check if a host responds to ping
 */
export async function checkPing(host: string, options: WaitOptions): Promise<boolean> {
  const { verbose } = options;
  
  try {
    // Different ping commands based on OS
    const platform = os.platform();
    let pingCommand: string;
    
    if (platform === 'win32') {
      // Windows
      pingCommand = `ping -n 1 -w 1000 ${host}`;
    } else {
      // Linux, macOS, etc.
      pingCommand = `ping -c 1 -W 1 ${host}`;
    }
    
    if (verbose) {
      console.debug(`Executing ping command: ${pingCommand}`);
    }
    
    await execPromise(pingCommand);
    
    if (verbose) {
      console.debug(`Ping successful to ${host}`);
    }
    
    return true;
  } catch (error) {
    if (verbose) {
      console.debug(`Ping failed to ${host}:`, error);
    }
    return false;
  }
}