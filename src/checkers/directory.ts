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
      console.debug(`Directory exists: