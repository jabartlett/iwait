// src/checkers/socket.ts
import net from 'net';
import type { WaitOptions } from '../types';

/**
 * Check if a Unix domain socket is available
 */
export async function checkSocket(socketPath: string, options: WaitOptions): Promise<boolean> {
  const { verbose } = options;
  
  return new Promise<boolean>((resolve) => {
    const socket = new net.Socket();
    let hasResolved = false;
    
    const cleanup = () => {
      if (!socket.destroyed) {
        socket.destroy();
      }
    };
    
    const resolveOnce = (result: boolean) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve(result);
      }
    };
    
    socket.on('connect', () => {
      if (verbose) {
        console.debug(`Socket connection successful to ${socketPath}`);
      }
      resolveOnce(true);
    });
    
    socket.on('error', (error) => {
      if (verbose) {
        console.debug(`Socket connection error to ${socketPath}:`, error);
      }
      resolveOnce(false);
    });
    
    // Try to connect
    socket.connect(socketPath);
  });
}