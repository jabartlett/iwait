// src/checkers/directory.ts
import fs from 'fs/promises';
import path from 'path';
import type { WaitOptions } from '../types';

/**
 * Check if a directory exists and optionally has files
 */
export async function checkDir(dirPath: string, options: WaitOptions): Promise<boolean> {
  const { dirNotEmpty, verbose } = options;
  
  try {
    // Check if directory exists
    const stats = await fs.stat(dirPath);
    
    if (!stats.isDirectory()) {
      if (verbose) {
        console.debug(`Path exists but is not a directory: ${dirPath}`);
      }
      return false;
    }
    
    if (verbose) {
      console.debug(`Directory exists: ${dirPath}`);
    }
    
    // If dirNotEmpty is true, check if the directory contains files
    if (dirNotEmpty) {
      const files = await fs.readdir(dirPath);
      if (files.length > 0) {
        if (verbose) {
          console.debug(`Directory ${dirPath} is not empty, contains: ${files.join(', ')}`);
        }
        return true;
      } else {
        if (verbose) {
          console.debug(`Directory ${dirPath} is empty`);
        }
        return false;
      }
    }
    
    // If dirNotEmpty is false, just return true if the directory exists
    return true;
  } catch (error) {
    if (verbose) {
      console.debug(`Directory ${dirPath} does not exist or cannot be accessed`, error);
    }
    return false;
  }
}