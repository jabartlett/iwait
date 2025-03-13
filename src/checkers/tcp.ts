// src/checkers/tcp.ts
import net from 'net';
import { parseTcpHostPort } from '../parser';
import type { WaitOptions } from '../types';

/**
 * Check if a TCP port is open
 */
export async function checkTcp(tcpPath: string, options: WaitOptions): Promise<boolean> {
  const { tcpTimeout, verbose } = options;
  
  try {
    // Parse the host:port
    const { host, port } = parseTcpHostPort(tcpPath);
    
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
      
      // Set timeout
      socket.setTimeout(tcpTimeout || 300);
      
      socket.on('connect', () => {
        if (verbose) {
          console.debug(`TCP connection successful to ${host}:${port}`);
        }
        resolveOnce(true);
      });
      
      socket.on('timeout', () => {
        if (verbose) {
          console.debug(`TCP connection timed out to ${host}:${port}`);
        }
        resolveOnce(false);
      });
      
      socket.on('error', (error) => {
        if (verbose) {
          console.debug(`TCP connection error to ${host}:${port}:`, error);
        }
        resolveOnce(false);
      });
      
      // Try to connect
      socket.connect(port, host);
    });
  } catch (error) {
    if (verbose) {
      console.debug(`Error parsing TCP path ${tcpPath}:`, error);
    }
    return false;
  }
}