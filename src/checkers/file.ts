// src/checkers/file.ts
import fs from 'fs/promises';
import { globSync } from 'glob';
import type { WaitOptions } from '../types';

// Cache for file sizes
const fileSizeCache = new Map<string, { size: number, timestamp: number }>();

/**
 * Check if a file exists and has stabilized in size
 */
export async function checkFile(filePath: string, options: WaitOptions): Promise<boolean> {
  const { window, verbose } = options;
  
  // Check if it's a wildcard pattern
  if (filePath.includes('*') || filePath.includes('?')) {
    return checkWildcardFile(filePath, options);
  }
  
  try {
    const stats = await fs.stat(filePath);
    const currentSize = stats.size;
    const now = Date.now();
    
    if (verbose) {
      console.debug(`File ${filePath} exists with size ${currentSize}`);
    }
    
    const cached = fileSizeCache.get(filePath);
    
    // If we have a cached size and it hasn't changed
    if (cached && cached.size === currentSize) {
      // Check if it's been stable for the window period
      if (now - cached.timestamp >= window!) {
        if (verbose) {
          console.debug(`File ${filePath} size has stabilized at ${currentSize} bytes`);
        }
        return true;
      }
      
      // Size is the same but hasn't been stable long enough
      return false;
    }
    
    // Update the cache with current size
    fileSizeCache.set(filePath, { size: currentSize, timestamp: now });
    return false;
  } catch (error) {
    if (verbose) {
      console.debug(`File ${filePath} does not exist or cannot be accessed`, error);
    }
    return false;
  }
}

/**
 * Check wildcard file pattern
 */
async function checkWildcardFile(pattern: string, options: WaitOptions): Promise<boolean> {
  const { verbose } = options;
  
  try {
    const matches = globSync(pattern);
    
    if (verbose) {
      console.debug(`Wildcard pattern ${pattern} matched ${matches.length} files`);
    }
    
    if (matches.length === 0) {
      return false;
    }
    
    // Check each matched file
    const results = await Promise.all(
      matches.map(filePath => checkFile(filePath, options))
    );
    
    // All files must be ready
    return results.every(Boolean);
  } catch (error) {
    if (verbose) {
      console.debug(`Error checking wildcard pattern ${pattern}`, error);
    }
    return false;
  }
}